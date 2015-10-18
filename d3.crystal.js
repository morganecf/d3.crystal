/*
	USAGE: 

	// Initialize 
	var force = d3.crystal();

	// The usual force layout stuff
	force.gravity(1)
		.charge(-3000)
		.linkDistance(50)
		.size([width, height]);

	// The crystal stuff
	force.crystallize_nodes(node)
		.crystallize_links(link)
		.crystallize();

	// or .crystallize({'iter': 50000, 'ms': 500, 'start_node': 'start'}) 
	// to specify simulation iterations, animation interval and start node use the iter, ms and start_node attributes
	// start_node must be the name of the start node -- will change this to just be the node 
*/

d3.crystal = function () {
	/* The basic force layout to extend */
	var force = d3.layout.force();

	/* Default parameters */

	// Default animation interval 
	var ms = 300;
	// Default number of simulation iterations
	var iter = 10000;

	/* Helper functions */
	var rand = function (a) { return a[Math.floor(a.length * Math.random())]; };
	var name_from_node = function (n) {
		var name;
		d3.select(n).attr('d', function (d) { name = d.name });
		return name;
	};

	/* Generation strategies */

	// Return a random walk from the start node (or several, to cover entire graph)
	var random_walk = function (start, graph, nodes) {
		var unseen = {};
		nodes.forEach(function (n) { unseen[name_from_node(n)] = n; });

		var walk = [unseen[start]];
		delete unseen[start];
		
		var curr = start;
		var neighbors;
		while (walk.length < nodes.length) {
			neighbors = graph[start].filter(function (n) { return n.target.name in unseen; });
			
			// If this node has neighbors, pick a random one 
			if (neighbors.length > 0) curr = rand(neighbors).target.name;

			// Otherwise we've hit a dead end -- pick a random unseen node and start over
			else curr = rand(Object.keys(unseen));

			// We've seen it 
			walk.push(unseen[curr]);
			delete unseen[curr];
		}
		walk.reverse();
		return walk;
	};

	// Return nodes in BFS order  
	var bfs = function (start, graph, mapping) { return []; };

	/* The svg nodes and links */
	var node, link;

	/* Load the svg nodes and links */
	force.crystallize_nodes = function (svg_node) {
		node = svg_node;
		return this;
	};
	force.crystallize_links = function (svg_link) {
		link = svg_link;
		return this;
	}

	/* Simulate and render the network */
	force.crystallize = function (params) {
		if (params && 'iter' in params) iter = params.iter;
		if (params && 'ms' in params) ms = params.ms;

		this.start();
	    for (var i = iter; i > 0; --i) this.tick();
	    this.stop();
		
		node.attr("transform", function (d) {  console.log(d); return 'translate(' + [d.x, d.y] + ')'; })
			.attr("id", function (d) { return d.name; })
			.style("visibility", "hidden");

		link.attr("x1", function (d) { return d.source.x; })
			.attr("y1", function (d) { return d.source.y; })
			.attr("x2", function (d) { return d.target.x; })
			.attr("y2", function (d) { return d.target.y; })
			.attr("id", function (d) { return d.source.name + "-" + d.target.name; })
			.style("visibility", "hidden");

		var links = link[0];
		var nodes = node[0];

		// Create graph from nodes and links
		var graph = {};
		var edge;
		for (var i = 0; i < links.length; i++) {
			edge = d3.select(links[i])[0][0].__data__;
			if (edge.source.name in graph) graph[edge.source.name].push(edge);
			else graph[edge.source.name] = [edge];
		}

		// If a start node is specified
		if (params && 'start_node' in params) {
			// And random walk is specified, create a random walk(s) from that node
			//if (walk) var hidden = random_walk(params.start_node, graph, nodes);
			// Otherwise follow edges in breadth-first fashion
			//else var hidden = bfs(params.start_node, graph, nodes);
			var hidden = random_walk(params.start_node, graph, nodes);
		}
		else var hidden = nodes.map(function (n) { return n; });

		// Path constructor 
		var line = d3.svg.line();

		var paths = []; 
		var edge_ids = [];

		var crystal_force = this;
		var link_svg = link;
		var node_svg = node;

		var step = function () {
			if (hidden.length > 0) {
				// Show node 
				var node = d3.select(hidden.pop());
				node.style("visibility", "visible");
				var data;
				node.attr('d', function (d) { data = d; });

				// Find the node's associated edges 
				var edges = graph[data.name];
				if (edges) {
					var edge_id, points, path;
					for (var i = 0; i < edges.length; i++) {
						edge_id = edges[i].source.name + '-' + edges[i].target.name;

						// use px/py or x/y??? 
						points = [[edges[i].source.x, edges[i].source.y], [edges[i].target.x, edges[i].target.y]];

						// Create and animate path 
						path = svg.append("path")
							.attr("d", line(points))
							.attr("class", "temp-path")
							.transition()
							.duration(ms)
							.attrTween("stroke-dasharray", tweenDash)
							.each(function () {	// Show target
								d3.select("#" + edges[i].target.name).style("visibility", "visible");
							});

						edge_ids.push(edge_id);
						paths.push(path);
					}
				}

				if (hidden.length > 0) setTimeout(step, ms);
				else step();
			}

			// When we're done, remove the paths and show the real edges 
			else {
				edge_ids.forEach(function (eid) { d3.select('#' + eid).style("visibility", "visible"); })
				var elems = document.getElementsByClassName("temp-path");
    			while(elems.length > 0){
        			elems[0].parentNode.removeChild(elems[0]);
    			};

				// Also resume the force 
				crystal_force.start();
				crystal_force.on("tick", function () {
					link_svg.attr("x1", function (d) { return d.source.x; })
						.attr("y1", function (d) { return d.source.y; })
						.attr("x2", function (d) { return d.target.x; })
						.attr("y2", function (d) { return d.target.y; });

					node_svg.attr("transform", function (d) {  return 'translate(' + [d.x, d.y] + ')'; });
				});
			}
		};

		// thanks mike 
		function tweenDash () {
			var l = this.getTotalLength();
			var i = d3.interpolateString("0," + l, l + "," + l);
			return function (t) { return i(t); };
		}

		setTimeout(step, 1);
	};

	return force; 
};




