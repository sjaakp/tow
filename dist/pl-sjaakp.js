/**
 * Couldn't get Tau Prolog's apply/3 or apply/4 to work under a Javascript worker thread
 *      to call postMessage.
 * So I made a replacement prolog module with just one predicate: postMessage/2.
 *
 * :- use_module(library(postmessage)).
 * @link http://tau-prolog.org/manual/making-your-own-packages
 *
 */
// var pl;
(function( pl ) {
    // Name of the module
    const name = 'postmessage';
    // Object with the set of predicates, indexed by indicators (name/arity)
    const predicates = () => {
        return {
            'postmessage/2': function (thread, point, atom) {
                const command = atom.args[0], args = atom.args[1];
                if (pl.type.is_variable(command) || pl.type.is_variable(args)) {
                    thread.throw_error(pl.error.instantiation(atom.indicator));
                } else if (!pl.type.is_atom(command)) {
                    thread.throw_error(pl.error.type('atom', command, atom.indicator));
                } else if (!pl.type.is_list(args)) {
                    thread.throw_error(pl.error.type('list', args, atom.indicator));
                }
                let pointer = args, pltojs, arr = [];
                while (pointer.indicator === './2') {
                    pltojs = pointer.args[0].toJavaScript();
                    if (pltojs === undefined) {
                        thread.throw_error(pl.error.domain('javascript_object', pointer.args[0], atom.indicator));
                        return undefined;
                    }
                    arr.push(pltojs);
                    pointer = pointer.args[1];
                }
                if (pl.type.is_variable(pointer)) {
                    thread.throw_error(pl.error.instantiation(atom.indicator));
                    return;
                } else if (pointer.indicator !== '[]/0') {
                    thread.throw_error(pl.error.type('list', args, atom.indicator));
                    return
                }
                try {
                    postMessage.apply(self, [{command: command.id, args: arr}]);
                } catch (e) {
                    thread.throw_error(e.toString(), atom.indicator);
                    return;
                }
                thread.success(point);
            },
            'put_html/2': two_arity('put_html'),
            'append_html/2': two_arity('append_html'),
            'prepend_html/2': two_arity('prepend_html'),
            'add_classes/2': two_arity('add_classes'),
            'remove_classes/2': two_arity('remove_classes'),
            'set_style_prop/3': three_arity('set_style_prop'),
            'set_attribute/3': three_arity('set_attribute'),
        };
    };

    const exports = [ 'postmessage/2', 'add_classes/2', 'remove_classes/2', 'put_html/2',
        'append_html/2', 'prepend_html/2', 'set_style_prop/3', 'set_attribute/3' ];
    new pl.type.Module( name, predicates(), exports );
})( pl );

function two_arity(clause, fn = null)
{
    if (! fn) fn = clause;
    return [
        new pl.type.Rule(new pl.type.Term(clause,
        [
            new pl.type.Var('Id'), new pl.type.Var('X')
        ]),
        new pl.type.Term('postmessage',
        [
            new pl.type.Term(fn, []),
            new pl.type.Term('.',
            [
                new pl.type.Var('Id'),
                new pl.type.Term('.', [
                    new pl.type.Var('X'), new pl.type.Term('[]', [])
                ])
            ])
        ]))
    ];
}

function three_arity(clause, fn = null) {
    if (!fn) fn = clause;
    return [
        new pl.type.Rule(new pl.type.Term(clause,
        [
            new pl.type.Var('Id'), new pl.type.Var('X'), new pl.type.Var('Y')
        ]),
        new pl.type.Term('postmessage',
        [
            new pl.type.Term(fn, []),
            new pl.type.Term('.',
            [
                new pl.type.Var('Id'),
                new pl.type.Term('.', [
                    new pl.type.Var('X'), new pl.type.Term('.', [
                        new pl.type.Var('Y'), new pl.type.Term('[]', [])])
                ])
            ])
        ]))
    ];
}
