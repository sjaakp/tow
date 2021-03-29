

function Tow(options = {}/*id, options, data*/) {
    if (!window.Worker) {
        console.error('This browser doesn\'t support Worker-threads');
        return;
    }
    this.settings = Object.assign({}, this.defaults, options);

    this.key_index = 1;
    this.executors = new Map();

    let loc = new URL(document.currentScript.src).pathname;

    this.dir = loc.substring(0, loc.lastIndexOf('/') + 1);

    this.createWorker();

    console.log(this);
}

Tow.prototype = {

    defaults: {
        limit: 10000
    },

    createWorker: function()
    {
        this.worker = new Worker(this.dir + `worker.js?limit=${this.settings.limit}`);
        this.worker.onmessage = e => {
            this[e.data.command].apply(this, e.data.args);
        };
    },

    killWorker: function()
    {
        this.worker.terminate();
        this.createWorker();
    },

    workerCommand: function(command, data = [])  {
        return new Promise((resolve, reject) => {
            let key = this.key_index++;
            this.executors.set(key, {resolve, reject});
            data.unshift(key);

            this.worker.postMessage({ command: command, args: data });
        });
    },

    new_session: function() {
        return this.workerCommand('new_session');
    },

    consult: function(c) {
        return this.workerCommand('consult', [c]);
    },

    query: function(q) {
        return this.workerCommand('query', [q]);
    },

    answer: function() {
        return this.workerCommand('answer');
    },

    version: function() {
        return this.workerCommand('version');
    },

    answers: function(maxAnswers = 0)
    {
        const tow1 = this;
        return {
            async * [Symbol.asyncIterator]() {
                let ans = '';
                do {
                    await tow1.answer()
                        .then((a) => { ans = a })
                    yield ans;
                } while (ans.endsWith(';') && --maxAnswers !== 0);
            },
        };
    },

    response: function(key, status, data) {
        let exec = this.executors.get(key);

        if (exec) {
            this.executors.delete(key);
            switch (status) {
                case 'success':
                    exec.resolve(data);
                    break;
                case 'fail':
                    exec.resolve('fail.');
                    break;
                case 'error':
                    exec.reject(data);
                    break;
                case 'limit':
                    exec.reject('limit.');
                    break;
            }
        }
    },
    output: (text) => {
        console.log('output:', text);
    },
    put_html: (id, html) => {
        document.getElementById(id).innerHTML = html;
    },
    append_html: (id, html) => {
        document.getElementById(id).innerHTML += html;
    },
    prepend_html: (id, html) => {
        const el = document.getElementById(id);
        el.innerHTML = html + el.innerHTML;
    },
    add_classes: (id, cls) => {
        if (typeof cls === 'string') cls = [cls];
        document.getElementById(id).classList.add(...cls);
    },
    remove_classes: (id, cls) => {
        if (typeof cls === 'string') cls = [cls];
        document.getElementById(id).classList.remove(...cls);
    },
    set_style_prop: (id, prop, value) => {
        document.getElementById(id).style[prop] = value;
    },
    set_attribute: (id, attr, value) => {
         document.getElementById(id).setAttribute(attr, value);
    },

};

let tow = new Tow({ limit: 15000 });

// tow.query('current_prolog_flag(version_data, V).')
//tow.query('test(X).')
/*

tow.consult(tow.dir + 'blok.pl')
    .then(() => tow.consult(tow.dir + 'heeft.pl'))
    .then(() => tow.query('blok(X), heeft(amsterdam, Y).'))
    .then(() => tow.answer())
    .then((value) => {
        console.log('answer:', value);
    })
    .catch((reason) => {
        console.log('reason:', reason);
    });
*/
// tow.version().then((ans) => console.log('version:', ans));


/*

(async function()
{
    try {
        await tow.consult(tow.dir + 'blok.pl');
        await tow.consult(tow.dir + 'heeft.pl');
        // await tow.query('blok(X).');
        // for await (const answ of tow.answers())   {
        //      console.log(answ);
        // }
        // const value = await tow.answer();
        // console.log('answer:', value);
    }
    catch(e) {
        console.log('reason:', e);
    }
})()

*/

