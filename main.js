console.log('hello world!');

var svg = d3.select('svg'),
	// cause use either '+' or parseInt
	width = +svg.attr('width'),
	height= +svg.attr('height');

// squareroot scale
var area = d3.scaleSqrt()
	.range([2, 50]);	// the min and max size of bubbles

// color scale
var color = d3.scaleLinear()
	.interpolate(d3.interpolateHcl)
	.range(['#007AFF', '#FEB24C']);	// two color scale and we interpolate between those two colors

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
			geo: name_map.filter(function(m) {	// looking up country code in gdp_data and finding the match in name_map
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
		.force('charge', d3.forceManyBody().strength(1))
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



	for (var i = 0; i < 100; i++) {
		simulation.tick();
	}
	ticked();



	console.log(data);
	function ticked() {
		// bind data to bubbles
		var bubbles = d3.select('svg')
			.selectAll('circle')
			.data(data, function(d) {
				return d.code;	// we use code as the key to bind our data since we know that the codes are all unique
			});
		// update pattern
		bubbles.enter()
			.append('circle')
			.merge(bubbles)		// lets use create and update our bubbles at the same time
			// set properties on our circles
			.attr('r', function(d) {
				return area(d.gdp);
			})
			.attr('cx', function(d) {
				return d.x;
			})
			.attr('cy', function(d) {
				return d.y;
			})
			.attr('fill', function(d) {
				return color(d.gdp);
			})
			.attr('stroke', '#333')
			.on('mouseover', function(d) {
				tooltip.html(d.geo + "<br>" + "$" + d.gdp.toLocaleString());		//toLocaleString makes the string more readable (15000 --> 15,000)
				tooltip.style('visibility', 'visible');
				d3.select(this).attr('stroke', 'green');
			})
			.on('mousemove', function() {
				tooltip.style('top', (d3.event.pageY - 10) + 'px')	// -10 and +10 pads our tooltip so that the mouse doesn't cover the info when we hover over a circle
					.style('left', (d3.event.pageX + 10) + 'px');
			})
			.on('mouseout', function() {
				tooltip.style('visibility', 'hidden');
				d3.select(this).attr('stroke', '#333');
			});
	}
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




















