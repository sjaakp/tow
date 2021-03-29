
let window = self;  // to keep tau-prolog.js happy; expects window != undefined

let loc = location.pathname,
    dir = loc.substring(0, loc.lastIndexOf('/') + 1);
let options = new URLSearchParams(location.search);

// importScripts  only works for local scripts!
importScripts(dir + 'tau-prolog.js', dir + 'pl-sjaakp.js');

console.log(pl);

let session = createSession(options.get('limit'));

console.log(session);

function createSession(limit)
{
    let r = pl.create(limit);

    let strm = new pl.type.Stream({
        put: function( text, _ ) {
            postMessage({ command: 'output', args: [text] });
            return true;
        },
        flush: function() {
            return true;
        }
    }, "write", "user_output", "text", false, "eof_code");
    r.streams.user_output = strm;
    r.standard_output = strm;
    r.current_output = strm;

    r.consult(':- use_module(library(postmessage)).', {
        script: false,
    });

    return r;
}

onmessage = e => {
    this[e.data.command].apply(this, e.data.args);
};

function postResponse(key, status, data = null)
{
    postMessage({ command: 'response', args: [ key, status,  data ] });
}

function new_session(key)
{
    session = createSession(options.get('limit'));
    postResponse(key, 'success');
    console.log('worker: new session');
}

function consult(key, c)
{
    session.consult(c, {
        success: () => {
            postResponse(key, 'success', c);
        },
        error: (e) => {
            postResponse(key, 'error', session.format_answer(e));
        },
        script: false
    });
}

function query(key, q)   {
    session.query(q, {
        success: () => {
            postResponse(key, 'success', q);
        },
        error: (e) => {
            postResponse(key, 'error', pl.format_answer(e));
        }
    });
}

function answer(key)   {
    session.answer({
        success: (a) => {
            postResponse(key, 'success', pl.format_answer(a));
        },
        error: (e) => {
            postResponse(key, 'error', pl.format_answer(e));
        },
        fail: () => {
            postResponse(key, 'fail');
        },
        limit: () => {
            postResponse(key, 'limit');
        },
    });
}

function version(key)   {
    postResponse(key, 'success', pl.version);
}
