# d3.crystal
D3 plugin to animate force-directed layouts. View a demo here: http://cs.mcgill.ca/~mciot/crystal-demo.html

Usage
-----

Create the force layout as a d3.crystal object, with the usual parameters. 

```
var force = d3.crystal()
	.gravity(1)
	.charge(-3000)
	.linkDistance(50)
	.size([width, height]);
```

Create svg links/nodes as usual. 

```
// SVG link edges 
var link = svg.selectAll("line")
	.data(data.links)
	.enter()
	.append("line")
	.attr("class", "link")
	.attr("id", function (d) { return d.source.name + "-" + d.target.name; })
	.attr("stroke-width", 3)
	.attr("stroke", "#fff");
		
// SVG nodes
var node = svg.selectAll("circle")
	.data(data.nodes)
	.enter()
	.append("circle")
	.attr("class", "node")
	.attr("id", function (d) { return d.name; })
	.attr("r", 15)
	.attr("fill", "#fff")
	.call(force.drag);
```

Initialize/start the layout. This requires passing in the node/link data and the node/link svg objects. 

```
force.nodes(data.nodes).links(data.links)
	.crystallize_nodes(node).crystallize_links(link)
	.crystallize({
		iter: 500000,			/* # of iterations simulation runs for - default is 100000 */
		ms: 500,			/* Animation interval - default is 300 ms */
		start_node: 'willow'		/* Node to start at - must be name of node */
	});
```
