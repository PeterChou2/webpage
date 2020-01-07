import * as d3 from "d3";
import {piechart} from "./piechart";

/**
transformtopie(data){
    this.detachevent();
    // set radius of pie chart
    let innerradius = 100;
    let outterradius = 200;

    let chart = this;
    let groupdata = this.withdrawal.filter(d => chart.currentlevel.callback(data) === chart.currentlevel.callback(d));
    // transition selected group into location
    // set a scale to translate
    var transitionY = d3.scaleLinear()
        .domain([Math.max.apply(null, groupdata.map(d => d.end)), 0])
        .range([this.height/2, this.height]);

    this.bargroup.selectAll("rect")
        .filter(d => chart.currentlevel.callback(data) === chart.currentlevel.callback(d))
        .transition()
        .ease(d3.easeLinear)
        .duration(500)
        .attr("x", this.width / 2 - outterradius)
        .attr('y', function (d) {return transitionY(d.end)}.bind(this))
        .attr('height', function (d){return Math.abs(transitionY(d.start) - transitionY(d.end))}.bind(this))
        .attr("width", outterradius - innerradius)
        .on("end", function(){
            let newpiechart = new piechart(groupdata, this.container, this.colorscale,
                innerradius, outterradius)
        }.bind(this))
        .transition()
        .duration(1000)
        .attr("y", this.height/2)
        .attr("height", 0)
    // make it go up
    // set opacity for rest of graph to 0
}
 **/