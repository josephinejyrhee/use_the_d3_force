console.log('hello world from canvas!');

// create dimensions of canvas
var width = 700;
var height = 700;

var ratio = window.devicePixelRatio || 1;

var canvas = d3.select('canvas');
canvas.attr('width', width * ratio)
	.attr('height', height * ratio)
	.style('width', width + 'px')
	.style('height', height + 'px');

// we draw on canvas using context
// use .node() to get the DOM element and the DOM element has the getContext
var ctx = canvas.node().getContext('2d');
ctx.scale(ratio, ratio);

// squareroot scale
var area = d3.scaleSqrt()
	.range([2, 50]);	// the min and max size of bubbles

// color scale
var color = d3.scaleLinear()
	.interpolate(d3.interpolateHcl)
	.range(['#007AFF', '#FEB24C']);	// two color scale and we interpolate between those two colors


var quadtree = d3.quadtree()
	.x(function(d) { return d.x; })
	.y(function(d) { return d.y; })
	.extent([		// array of an array
		[0, 0],
		[width, height]
	]);


// d3 queue lets us do multiple asyncronous calls at once and wait for it to be done
// useful when we need to load multiple files
// prevents having a callback within a callback within a callback ...
d3.queue()
	.defer(d3.csv, 'data/country_names_codes.csv')
	.defer(d3.csv, 'data/gapminder_gdp.csv')
	.await(main);	// await: once we're done loading everything, invoke the main function

function main(error, name_map, gdp_data) {
	if (error) throw error;

	var data = gdp_data.map(function(d) {
		return {
			gdp: +d.gdp_per_capita_cppp,	// parse string into a number
			code: d.geo,
			name: name_map.filter(function(m) {	// looking up country code in gdp_data and finding the match in name_map
				return m.geo === d.geo;
			})
			.map(function(k) { return k.name; })[0],	// map always returns an array
		};
	});
	// console.log(data);

	// returns the min and max of gdp
	var extent = d3.extent(data, function(d) {
		return d.gdp;
	});

	// set domain of area and color to extent
	area.domain(extent);
	color.domain(extent);


	// once the simulation is invoked, it starts to automatically update the nodes over and over based on the forces applied
	var simulation = d3.forceSimulation(data)
		.force('charge', d3.forceManyBody().strength(-1))
		.force('center', d3.forceCenter(width / 2, height / 2))
		.force(
			'collision',
			d3.forceCollide()
			.strength(1)
			.radius(function(d) {
				return area(d.gdp);
			}))
		.on('tick', ticked);
		// .stop();

	// for (var i = 0; i < 100; i++) {
	// 	simulation.tick();
	// }
	// ticked();




	function ticked() {
		// draw stuff in canvas
		ctx.clearRect(0, 0, width, height);		// telling canvas to clear the drawing area
		
		data.forEach(function(d) {
			ctx.beginPath();
			ctx.arc(d.x, d.y, area(d.gdp), 0, Math.PI * 2);
			ctx.stroke();
			ctx.fillStyle = color(d.gdp);
			ctx.strokeStyle = '#333';
			ctx.lineWidth = 2;
			ctx.fill();


			// render text labels
			ctx.fillStyle = '#fff';
			ctx.font = '11px sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseLine = 'middle';
			ctx.fillText(d.code, d.x, d.y);
		});


		// quadTree is going to be recomputed with each iteration
		tree = quadtree.addAll(data);
	}

	canvas.on('mousemove', function() {
		var mouse = d3.mouse(this),
			closest = tree.find(mouse[0], mouse[1]);
		tooltip
			.style('top', (d3.event.pageY - 10) + 'px')
			.style('left', (d3.event.pageX + 10) + 'px')
			.html(closest.name + '<br>' + '$' + closest.gdp.toLocaleString());
	});

	canvas.on('mouseover', function(){
		tooltip.style('visibility', 'visible');
	});

	canvas.on('mouseout', function(){
		tooltip.style('visibility', 'hidden');
	});


};

// occurs before the asynchronous call
// css (can add it to the main.css)
var tooltip = d3.select('body')
	.append('div')
	.style('position', 'absolute')
	.style('visibility', 'hidden')
	.style('color', 'white')
	.style('padding', '8px')
	.style('background-color', '#626D71')
	.style('border-radius', '6px')
	.style('text-align', 'center')
	.style('font-family', 'monospace')
	.text('');
