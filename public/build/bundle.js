
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
        // Return first index of value larger than input value in the range [low, high)
        while (low < high) {
            const mid = low + ((high - low) >> 1);
            if (key(mid) <= value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    function init_hydrate(target) {
        if (target.hydrate_init)
            return;
        target.hydrate_init = true;
        // We know that all children have claim_order values since the unclaimed have been detached
        const children = target.childNodes;
        /*
        * Reorder claimed children optimally.
        * We can reorder claimed children optimally by finding the longest subsequence of
        * nodes that are already claimed in order and only moving the rest. The longest
        * subsequence subsequence of nodes that are claimed in order can be found by
        * computing the longest increasing subsequence of .claim_order values.
        *
        * This algorithm is optimal in generating the least amount of reorder operations
        * possible.
        *
        * Proof:
        * We know that, given a set of reordering operations, the nodes that do not move
        * always form an increasing subsequence, since they do not move among each other
        * meaning that they must be already ordered among each other. Thus, the maximal
        * set of nodes that do not move form a longest increasing subsequence.
        */
        // Compute longest increasing subsequence
        // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
        const m = new Int32Array(children.length + 1);
        // Predecessor indices + 1
        const p = new Int32Array(children.length);
        m[0] = -1;
        let longest = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i].claim_order;
            // Find the largest subsequence length such that it ends in a value less than our current value
            // upper_bound returns first greater value, so we subtract one
            const seqLen = upper_bound(1, longest + 1, idx => children[m[idx]].claim_order, current) - 1;
            p[i] = m[seqLen] + 1;
            const newLen = seqLen + 1;
            // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
            m[newLen] = i;
            longest = Math.max(newLen, longest);
        }
        // The longest increasing subsequence of nodes (initially reversed)
        const lis = [];
        // The rest of the nodes, nodes that will be moved
        const toMove = [];
        let last = children.length - 1;
        for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
            lis.push(children[cur - 1]);
            for (; last >= cur; last--) {
                toMove.push(children[last]);
            }
            last--;
        }
        for (; last >= 0; last--) {
            toMove.push(children[last]);
        }
        lis.reverse();
        // We sort the nodes being moved to guarantee that their insertion order matches the claim order
        toMove.sort((a, b) => a.claim_order - b.claim_order);
        // Finally, we move the nodes
        for (let i = 0, j = 0; i < toMove.length; i++) {
            while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
                j++;
            }
            const anchor = j < lis.length ? lis[j] : null;
            target.insertBefore(toMove[i], anchor);
        }
    }
    function append(target, node) {
        if (is_hydrating) {
            init_hydrate(target);
            if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
                target.actual_end_child = target.firstChild;
            }
            if (node !== target.actual_end_child) {
                target.insertBefore(node, target.actual_end_child);
            }
            else {
                target.actual_end_child = node.nextSibling;
            }
        }
        else if (node.parentNode !== target) {
            target.appendChild(node);
        }
    }
    function insert(target, node, anchor) {
        if (is_hydrating && !anchor) {
            append(target, node);
        }
        else if (node.parentNode !== target || (anchor && node.nextSibling !== anchor)) {
            target.insertBefore(node, anchor || null);
        }
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                start_hydrating();
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            end_hydrating();
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\component\Navbar.svelte generated by Svelte v3.38.3 */

    const file$2 = "src\\component\\Navbar.svelte";

    function create_fragment$2(ctx) {
    	let nav;
    	let div2;
    	let button;
    	let span;
    	let t0;
    	let div1;
    	let div0;
    	let t1;
    	let ul;
    	let li0;
    	let t2;
    	let li1;
    	let a;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div2 = element("div");
    			button = element("button");
    			span = element("span");
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			t1 = space();
    			ul = element("ul");
    			li0 = element("li");
    			t2 = space();
    			li1 = element("li");
    			a = element("a");
    			a.textContent = "Contact Me";
    			attr_dev(span, "class", "navbar-toggler-icon");
    			add_location(span, file$2, 3, 6, 295);
    			attr_dev(button, "class", "navbar-toggler");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "data-bs-toggle", "collapse");
    			attr_dev(button, "data-bs-target", "#navbarNavDropdown");
    			attr_dev(button, "aria-controls", "navbarNavDropdown");
    			attr_dev(button, "aria-expanded", "false");
    			attr_dev(button, "aria-label", "Toggle navigation");
    			add_location(button, file$2, 2, 4, 94);
    			attr_dev(div0, "class", "space-nav svelte-16cv699");
    			add_location(div0, file$2, 6, 6, 418);
    			attr_dev(li0, "class", "nav-item mt-1");
    			add_location(li0, file$2, 8, 8, 483);
    			attr_dev(a, "class", "kotak svelte-16cv699");
    			attr_dev(a, "href", "mailto:hiroandika@gmail.com");
    			add_location(a, file$2, 10, 10, 557);
    			attr_dev(li1, "class", "nav-item mt-1");
    			add_location(li1, file$2, 9, 8, 520);
    			attr_dev(ul, "class", "navbar-nav ");
    			add_location(ul, file$2, 7, 6, 450);
    			attr_dev(div1, "class", "collapse navbar-collapse");
    			attr_dev(div1, "id", "navbarNavDropdown");
    			add_location(div1, file$2, 5, 4, 350);
    			attr_dev(div2, "class", "container-fluid");
    			add_location(div2, file$2, 1, 2, 60);
    			attr_dev(nav, "class", "navbar navbar-expand-lg navbar-dark bg-dark");
    			add_location(nav, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div2);
    			append_dev(div2, button);
    			append_dev(button, span);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			append_dev(div1, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t2);
    			append_dev(ul, li1);
    			append_dev(li1, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Navbar", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\component\Main.svelte generated by Svelte v3.38.3 */

    const file$1 = "src\\component\\Main.svelte";

    function create_fragment$1(ctx) {
    	let section;
    	let div6;
    	let div4;
    	let div3;
    	let div2;
    	let h20;
    	let t1;
    	let div0;
    	let h1;
    	let t3;
    	let h3;
    	let t5;
    	let div1;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t6;
    	let a1;
    	let img1;
    	let img1_src_value;
    	let t7;
    	let a2;
    	let img2;
    	let img2_src_value;
    	let t8;
    	let div5;
    	let img3;
    	let img3_src_value;
    	let t9;
    	let div9;
    	let div7;
    	let h21;
    	let t11;
    	let p0;
    	let t13;
    	let div8;
    	let img4;
    	let img4_src_value;
    	let t14;
    	let div23;
    	let div22;
    	let div10;
    	let h40;
    	let t16;
    	let h41;
    	let t18;
    	let div15;
    	let div11;
    	let img5;
    	let img5_src_value;
    	let t19;
    	let p1;
    	let t21;
    	let div12;
    	let img6;
    	let img6_src_value;
    	let t22;
    	let p2;
    	let t24;
    	let div13;
    	let img7;
    	let img7_src_value;
    	let t25;
    	let p3;
    	let t27;
    	let div14;
    	let img8;
    	let img8_src_value;
    	let t28;
    	let p4;
    	let t30;
    	let div16;
    	let img9;
    	let img9_src_value;
    	let t31;
    	let h42;
    	let t33;
    	let div21;
    	let div17;
    	let img10;
    	let img10_src_value;
    	let t34;
    	let p5;
    	let t36;
    	let div18;
    	let img11;
    	let img11_src_value;
    	let t37;
    	let p6;
    	let t39;
    	let div19;
    	let img12;
    	let img12_src_value;
    	let t40;
    	let p7;
    	let t42;
    	let div20;
    	let img13;
    	let img13_src_value;
    	let t43;
    	let p8;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div6 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Hi, I am";
    			t1 = space();
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Andika Hiro Pratama";
    			t3 = space();
    			h3 = element("h3");
    			h3.textContent = "College Student";
    			t5 = space();
    			div1 = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t6 = space();
    			a1 = element("a");
    			img1 = element("img");
    			t7 = space();
    			a2 = element("a");
    			img2 = element("img");
    			t8 = space();
    			div5 = element("div");
    			img3 = element("img");
    			t9 = space();
    			div9 = element("div");
    			div7 = element("div");
    			h21 = element("h2");
    			h21.textContent = "About Me";
    			t11 = space();
    			p0 = element("p");
    			p0.textContent = "Saya adalah mahasiswa S1 Sistem Informasi di Universitas Pembangunan Nasional Jakarta, Saya tertarik dalam bidang pemrograman web lebih khususnya pada bidang frontend developer. Saat ini saya memasuki semester 5 di kampus dan ingin\r\n        mempelajari hal baru karena ilmu tidak akan ada batasnya untuk dipelajari.";
    			t13 = space();
    			div8 = element("div");
    			img4 = element("img");
    			t14 = space();
    			div23 = element("div");
    			div22 = element("div");
    			div10 = element("div");
    			h40 = element("h4");
    			h40.textContent = "SKILLS";
    			t16 = space();
    			h41 = element("h4");
    			h41.textContent = "USING NOW:";
    			t18 = space();
    			div15 = element("div");
    			div11 = element("div");
    			img5 = element("img");
    			t19 = space();
    			p1 = element("p");
    			p1.textContent = "HTML";
    			t21 = space();
    			div12 = element("div");
    			img6 = element("img");
    			t22 = space();
    			p2 = element("p");
    			p2.textContent = "CSS";
    			t24 = space();
    			div13 = element("div");
    			img7 = element("img");
    			t25 = space();
    			p3 = element("p");
    			p3.textContent = "BOOTSTRAP";
    			t27 = space();
    			div14 = element("div");
    			img8 = element("img");
    			t28 = space();
    			p4 = element("p");
    			p4.textContent = "SVELTE";
    			t30 = space();
    			div16 = element("div");
    			img9 = element("img");
    			t31 = space();
    			h42 = element("h4");
    			h42.textContent = "Learning Now:";
    			t33 = space();
    			div21 = element("div");
    			div17 = element("div");
    			img10 = element("img");
    			t34 = space();
    			p5 = element("p");
    			p5.textContent = "JAVASCRIPT";
    			t36 = space();
    			div18 = element("div");
    			img11 = element("img");
    			t37 = space();
    			p6 = element("p");
    			p6.textContent = "NODEJS";
    			t39 = space();
    			div19 = element("div");
    			img12 = element("img");
    			t40 = space();
    			p7 = element("p");
    			p7.textContent = "REACT";
    			t42 = space();
    			div20 = element("div");
    			img13 = element("img");
    			t43 = space();
    			p8 = element("p");
    			p8.textContent = "MONGODB";
    			attr_dev(h20, "class", "svelte-1lubrvd");
    			add_location(h20, file$1, 5, 10, 191);
    			attr_dev(h1, "class", "svelte-1lubrvd");
    			add_location(h1, file$1, 7, 12, 252);
    			attr_dev(h3, "class", "mt-2 caption svelte-1lubrvd");
    			add_location(h3, file$1, 8, 12, 294);
    			attr_dev(div0, "class", "nama svelte-1lubrvd");
    			add_location(div0, file$1, 6, 10, 220);
    			if (img0.src !== (img0_src_value = "/img/linkedin.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "linkedin");
    			add_location(img0, file$1, 12, 14, 499);
    			attr_dev(a0, "class", "kotak svelte-1lubrvd");
    			attr_dev(a0, "href", "https://id.linkedin.com/in/andika-hiro-0881431b1");
    			add_location(a0, file$1, 11, 12, 410);
    			if (img1.src !== (img1_src_value = "/img/github.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "github");
    			add_location(img1, file$1, 15, 14, 653);
    			attr_dev(a1, "class", "kotak ms-3 svelte-1lubrvd");
    			attr_dev(a1, "href", "https://github.com/andika-hiro");
    			add_location(a1, file$1, 14, 12, 577);
    			if (img2.src !== (img2_src_value = "/img/instagram.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "instagram");
    			add_location(img2, file$1, 18, 14, 813);
    			attr_dev(a2, "class", "kotak ms-3 svelte-1lubrvd");
    			attr_dev(a2, "href", "https://www.instagram.com/hiro_andika21/");
    			add_location(a2, file$1, 17, 12, 727);
    			attr_dev(div1, "class", "d-flex sosmed svelte-1lubrvd");
    			add_location(div1, file$1, 10, 10, 369);
    			attr_dev(div2, "class", "introduction svelte-1lubrvd");
    			add_location(div2, file$1, 4, 8, 153);
    			attr_dev(div3, "class", "left-profile svelte-1lubrvd");
    			add_location(div3, file$1, 3, 6, 117);
    			attr_dev(div4, "class", "kolom1 mt-2 align-content-center svelte-1lubrvd");
    			add_location(div4, file$1, 2, 4, 63);
    			if (img3.src !== (img3_src_value = "/img/profile.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "class", "profile-picture svelte-1lubrvd");
    			attr_dev(img3, "alt", "profile");
    			add_location(img3, file$1, 26, 6, 980);
    			attr_dev(div5, "class", "kolom2 mt-2 svelte-1lubrvd");
    			add_location(div5, file$1, 25, 4, 947);
    			attr_dev(div6, "class", "profile d-flex svelte-1lubrvd");
    			add_location(div6, file$1, 1, 2, 29);
    			attr_dev(h21, "class", "svelte-1lubrvd");
    			add_location(h21, file$1, 31, 6, 1143);
    			attr_dev(p0, "class", " aboutme mt-4 svelte-1lubrvd");
    			add_location(p0, file$1, 32, 6, 1168);
    			attr_dev(div7, "class", "aboutme-page svelte-1lubrvd");
    			add_location(div7, file$1, 30, 4, 1109);
    			if (img4.src !== (img4_src_value = "/img/logo-it.png")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "class", "logoit svelte-1lubrvd");
    			attr_dev(img4, "alt", "logo-it");
    			add_location(img4, file$1, 38, 6, 1579);
    			attr_dev(div8, "class", "logo-page svelte-1lubrvd");
    			add_location(div8, file$1, 37, 4, 1548);
    			attr_dev(div9, "class", "solidbox d-flex svelte-1lubrvd");
    			add_location(div9, file$1, 29, 2, 1074);
    			attr_dev(h40, "class", "svelte-1lubrvd");
    			add_location(h40, file$1, 44, 8, 1813);
    			attr_dev(div10, "class", "skill-title d-flex flex-column svelte-1lubrvd");
    			add_location(div10, file$1, 43, 6, 1759);
    			attr_dev(h41, "class", "spacing-letter margin-top svelte-1lubrvd");
    			add_location(h41, file$1, 46, 6, 1850);
    			if (img5.src !== (img5_src_value = "/img/html.png")) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "alt", "logo-html");
    			add_location(img5, file$1, 49, 10, 2000);
    			attr_dev(p1, "class", "nama-logo ms-2 spacing-letter mt-4 svelte-1lubrvd");
    			add_location(p1, file$1, 50, 10, 2055);
    			attr_dev(div11, "class", "logo-skills d-flex flex-column mt-5 svelte-1lubrvd");
    			add_location(div11, file$1, 48, 8, 1939);
    			if (img6.src !== (img6_src_value = "/img/css.png")) attr_dev(img6, "src", img6_src_value);
    			attr_dev(img6, "alt", "logo-css");
    			add_location(img6, file$1, 54, 10, 2209);
    			attr_dev(p2, "class", "nama-logo ms-3 spacing-letter mt-4 svelte-1lubrvd");
    			add_location(p2, file$1, 55, 10, 2262);
    			attr_dev(div12, "class", "logo-skills space-logo d-flex flex-column mt-5 svelte-1lubrvd");
    			add_location(div12, file$1, 53, 8, 2137);
    			if (img7.src !== (img7_src_value = "/img/bootstrap.png")) attr_dev(img7, "src", img7_src_value);
    			attr_dev(img7, "alt", "logo-bootstrap");
    			add_location(img7, file$1, 59, 10, 2415);
    			attr_dev(p3, "class", "nama-logo bstrp mt-4 svelte-1lubrvd");
    			add_location(p3, file$1, 60, 10, 2480);
    			attr_dev(div13, "class", "logo-skills space-logo d-flex flex-column mt-5 svelte-1lubrvd");
    			add_location(div13, file$1, 58, 8, 2343);
    			if (img8.src !== (img8_src_value = "/img/svelte.png")) attr_dev(img8, "src", img8_src_value);
    			attr_dev(img8, "alt", "logo-svelte");
    			add_location(img8, file$1, 64, 10, 2625);
    			attr_dev(p4, "class", "nama-logo ms-2 spacing-letter mt-4 svelte-1lubrvd");
    			add_location(p4, file$1, 65, 10, 2684);
    			attr_dev(div14, "class", "logo-skills space-logo d-flex flex-column mt-5 svelte-1lubrvd");
    			add_location(div14, file$1, 63, 8, 2553);
    			attr_dev(div15, "class", "logo svelte-1lubrvd");
    			add_location(div15, file$1, 47, 6, 1911);
    			if (img9.src !== (img9_src_value = "/img/seperator.png")) attr_dev(img9, "src", img9_src_value);
    			attr_dev(img9, "alt", "seperator");
    			add_location(img9, file$1, 69, 8, 2850);
    			attr_dev(div16, "class", "margin-top d-flex flex-column align-items-center svelte-1lubrvd");
    			add_location(div16, file$1, 68, 6, 2778);
    			attr_dev(h42, "class", "spacing-letter margin-top svelte-1lubrvd");
    			add_location(h42, file$1, 72, 6, 2922);
    			if (img10.src !== (img10_src_value = "/img/JavaScript.png")) attr_dev(img10, "src", img10_src_value);
    			attr_dev(img10, "alt", "logo-JavaScript");
    			add_location(img10, file$1, 75, 10, 3075);
    			attr_dev(p5, "class", "nama-logo bstrp mt-4 svelte-1lubrvd");
    			add_location(p5, file$1, 76, 10, 3142);
    			attr_dev(div17, "class", "logo-skills d-flex flex-column mt-5 svelte-1lubrvd");
    			add_location(div17, file$1, 74, 8, 3014);
    			if (img11.src !== (img11_src_value = "/img/nodejs.png")) attr_dev(img11, "src", img11_src_value);
    			attr_dev(img11, "alt", "logo-nodejs");
    			add_location(img11, file$1, 80, 10, 3288);
    			attr_dev(p6, "class", "nama-logo  spacing-letter mt-4 svelte-1lubrvd");
    			add_location(p6, file$1, 81, 10, 3347);
    			attr_dev(div18, "class", "logo-skills space-logo d-flex flex-column mt-5 svelte-1lubrvd");
    			add_location(div18, file$1, 79, 8, 3216);
    			if (img12.src !== (img12_src_value = "/img/react.png")) attr_dev(img12, "src", img12_src_value);
    			attr_dev(img12, "alt", "logo-react");
    			add_location(img12, file$1, 85, 10, 3499);
    			attr_dev(p7, "class", "nama-logo ms-2 spacing-letter mt-4 svelte-1lubrvd");
    			add_location(p7, file$1, 86, 10, 3556);
    			attr_dev(div19, "class", "logo-skills space-logo d-flex flex-column mt-5 svelte-1lubrvd");
    			add_location(div19, file$1, 84, 8, 3427);
    			if (img13.src !== (img13_src_value = "/img/mongodb.png")) attr_dev(img13, "src", img13_src_value);
    			attr_dev(img13, "alt", "logo-mongodb");
    			add_location(img13, file$1, 90, 10, 3711);
    			attr_dev(p8, "class", "nama-logo  spacing-letter mt-4 svelte-1lubrvd");
    			add_location(p8, file$1, 91, 10, 3772);
    			attr_dev(div20, "class", "logo-skills space-logo d-flex flex-column mt-5 svelte-1lubrvd");
    			add_location(div20, file$1, 89, 8, 3639);
    			attr_dev(div21, "class", "logo svelte-1lubrvd");
    			add_location(div21, file$1, 73, 6, 2986);
    			attr_dev(div22, "class", "skill-page svelte-1lubrvd");
    			add_location(div22, file$1, 42, 4, 1727);
    			attr_dev(div23, "class", "skill d-flex flex-column align-items-center svelte-1lubrvd");
    			add_location(div23, file$1, 41, 2, 1664);
    			attr_dev(section, "class", "halaman svelte-1lubrvd");
    			add_location(section, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div6);
    			append_dev(div6, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, h20);
    			append_dev(div2, t1);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t3);
    			append_dev(div0, h3);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, a0);
    			append_dev(a0, img0);
    			append_dev(div1, t6);
    			append_dev(div1, a1);
    			append_dev(a1, img1);
    			append_dev(div1, t7);
    			append_dev(div1, a2);
    			append_dev(a2, img2);
    			append_dev(div6, t8);
    			append_dev(div6, div5);
    			append_dev(div5, img3);
    			append_dev(section, t9);
    			append_dev(section, div9);
    			append_dev(div9, div7);
    			append_dev(div7, h21);
    			append_dev(div7, t11);
    			append_dev(div7, p0);
    			append_dev(div9, t13);
    			append_dev(div9, div8);
    			append_dev(div8, img4);
    			append_dev(section, t14);
    			append_dev(section, div23);
    			append_dev(div23, div22);
    			append_dev(div22, div10);
    			append_dev(div10, h40);
    			append_dev(div22, t16);
    			append_dev(div22, h41);
    			append_dev(div22, t18);
    			append_dev(div22, div15);
    			append_dev(div15, div11);
    			append_dev(div11, img5);
    			append_dev(div11, t19);
    			append_dev(div11, p1);
    			append_dev(div15, t21);
    			append_dev(div15, div12);
    			append_dev(div12, img6);
    			append_dev(div12, t22);
    			append_dev(div12, p2);
    			append_dev(div15, t24);
    			append_dev(div15, div13);
    			append_dev(div13, img7);
    			append_dev(div13, t25);
    			append_dev(div13, p3);
    			append_dev(div15, t27);
    			append_dev(div15, div14);
    			append_dev(div14, img8);
    			append_dev(div14, t28);
    			append_dev(div14, p4);
    			append_dev(div22, t30);
    			append_dev(div22, div16);
    			append_dev(div16, img9);
    			append_dev(div22, t31);
    			append_dev(div22, h42);
    			append_dev(div22, t33);
    			append_dev(div22, div21);
    			append_dev(div21, div17);
    			append_dev(div17, img10);
    			append_dev(div17, t34);
    			append_dev(div17, p5);
    			append_dev(div21, t36);
    			append_dev(div21, div18);
    			append_dev(div18, img11);
    			append_dev(div18, t37);
    			append_dev(div18, p6);
    			append_dev(div21, t39);
    			append_dev(div21, div19);
    			append_dev(div19, img12);
    			append_dev(div19, t40);
    			append_dev(div19, p7);
    			append_dev(div21, t42);
    			append_dev(div21, div20);
    			append_dev(div20, img13);
    			append_dev(div20, t43);
    			append_dev(div20, p8);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Main", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.38.3 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main1;
    	let navbar;
    	let t;
    	let main0;
    	let current;
    	navbar = new Navbar({ $$inline: true });
    	main0 = new Main({ $$inline: true });

    	const block = {
    		c: function create() {
    			main1 = element("main");
    			create_component(navbar.$$.fragment);
    			t = space();
    			create_component(main0.$$.fragment);
    			attr_dev(main1, "class", "svelte-dct3qq");
    			add_location(main1, file, 5, 0, 116);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main1, anchor);
    			mount_component(navbar, main1, null);
    			append_dev(main1, t);
    			mount_component(main0, main1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(main0.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(main0.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main1);
    			destroy_component(navbar);
    			destroy_component(main0);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Navbar, Main });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
      props: {},
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
