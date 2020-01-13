import * as d3 from "d3";

class piechart {
    constructor(data, container,
                innerradius, outerradius){

        this.original_data = data.filter(d => d.amount > 0);
        this.withdrawal = this.original_data.reverse();
        this.groupfunc = d3.nest()
                          .key(d => d.category[0])
                          .rollup(v => d3.sum(v, d => d.amount));

        this.groupdata = this.groupfunc.entries(this.withdrawal);
        //generator for pie chart
        this.generator = d3.pie()
            .sort(null)
            .value(d => d.value)
            .startAngle( 1.5 * Math.PI) // force start angle to be to on the left
            .endAngle(3.5 * Math.PI);
        //
        this.arc = d3.arc()
                     .innerRadius(innerradius)
                     .outerRadius(outerradius);
        //generate all angles
        this.chart = this.generator(this.groupdata);
        // copy of data for reference during animation
        this.chart.forEach(d => d.storage = {...d});
        console.log(this.groupdata);
        console.log(this.chart);

        this.arcs = container.append("g")
                             .attr("transform", "translate(350, 250)");

        this.colorcallback = d => d.category[0];
        this.allcategory = [...new Set(this.withdrawal.map(function(d){return this.colorcallback(d)}.bind(this)))];
        this.colorscale = d3.scaleOrdinal(d3.schemeCategory10)
                            .domain(this.allcategory);

        this.arcs
            .selectAll("path")
            .data(this.chart)
            .enter()
            .append("path")
            .style("fill", function(d){return this.colorscale(d.data.key)}.bind(this));


        this.innerradius = innerradius;
        this.outerradius = outerradius;
        //boolean
        this.visible = false;
    }

    updatedata(filterfn){
        //old position for later reference
        let olddata = this.chart.map(d => d.storage);
        let pie = this;
        let newdata = this.groupfunc.entries(this.original_data.filter(filterfn));
        //merge old data with new data note old data never exits (they are only set to 0)
        this.groupdata.forEach(
            function(d) {
                let newsum = newdata.filter(data => data.key === d.key);
                d.value = newsum.length === 0 ? 0 : newsum[0].value;
            }.bind(this)
        );
        //console.log(this.groupdata);
        this.chart = this.generator(this.groupdata);
        console.log(this.visible);
        if (this.visible){
            this.arcs
                .selectAll("path")
                .data(this.chart)
                .transition()
                .duration(1000)
                .attrTween("d", function(d){
                    let current = olddata.filter(old => old.data.key === d.data.key)[0];
                    d.innerRadius = pie.innerradius;
                    d.outerRadius = pie.outerradius;
                    //translate between the two using interpolate
                    let i = d3.interpolate(current, d);
                    let arc = d3.arc();
                    return t => {
                        return arc(i(t))
                    }
                }.bind(this));
        }

        this.chart.forEach(d => d.storage = {...d});

    }

    enter(){
        this.visible = true;
        let pie = this;
        //build interpolators
        let angleInterpolation = d3.interpolate(this.generator.startAngle()(), this.generator.endAngle()());
        console.log("enter animation");
        console.log(this.chart);
        this.arcs
            .selectAll("path")
            .data(this.chart)
            .transition()
            .duration(1000)
            .attrTween("d", d => {
                console.log(d);
                let originalEnd = d.storage.endAngle;
                return t => {
                    let currentAngle = angleInterpolation(t);
                    //prevent animation from starting before it angle reaches it
                    if (currentAngle < d.storage.startAngle) {
                        return ""
                    }
                    //d.innerRadius = pie.innerradius;
                    //d.outerRadius = pie.outerradius;
                    d.endAngle = Math.min(currentAngle, originalEnd);
                    return pie.arc(d);
                }
            })

    }

    exit(){
        this.visible = false;
        let pie = this;
        let angleInterpolation = d3.interpolate(this.generator.endAngle()(), this.generator.startAngle()());
        console.log("exit animation");
        this.arcs
            .selectAll("path")
            .transition()
            .duration(1000)
            .attrTween("d", d => {
                console.log(d);
                let originalEnd = d.startAngle;
                return t => {
                    let currentAngle = angleInterpolation(t);
                    //stop animation once it finishes
                    if (d.endAngle < currentAngle) {
                        return pie.arc(d);
                    }
                    //d.innerRadius = pie.innerradius;
                    //d.outerRadius = pie.outerradius;
                    d.endAngle = Math.max(currentAngle, originalEnd);
                    return pie.arc(d);
                }
            })
    }
}


export {
    piechart
}