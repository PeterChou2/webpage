import * as d3 from "d3";
import {piechart} from './piechart.js'

class barchart {
    constructor(data, container, width, height) {
        console.log(data);
        // original data is data we wont touch and is used for updating data
        this.container = container;
        this.original_data = data.filter(d => d.amount > 0);
        this.width = width;
        this.height = height;
        this.currentlevel = {code: 0, callback: d => d.transaction_id};
        // withdrawal is data actually displayed
        this.withdrawal = this.original_data;
        // assign properties used for display
        this.withdrawal.forEach(function(v){
            v.end = v.amount;
            v.start = 0;
        });
        // boolean identify if we want animation to be instant
        this.instant = false;
        // boolean identify if we want to see barchart
        this.hidden = false;
        // function which extracts information to be sent to the color scale
        this.colorcallback = d => d.category[0];
        this.allcategory = [...new Set(this.withdrawal.map(function(d){return this.colorcallback(d)}.bind(this)))];
        this.colorscale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(this.allcategory);

        this.legend = this.allcategory.map(function(d){
            return {color: this.colorscale(d),
                labels: d}
        }.bind(this));

        // tooltip (not done)
        //let tooltip = d3.select(divcontainers)
        //                .append("div")
        //                .attr("class", "tooltip")
        //.style("opacity", 0);

        // deposit is influx of money (possible future feature)
        this.deposit = data.filter(d => d.amount < 0);
        this.xScale = d3.scaleBand()
            .domain(this.withdrawal.map(d => d.transaction_id).reverse())// reverse to make dates go from left to right
            .range([0, width])
            .padding(0.1);
        this.yScale = d3.scaleLinear()
            .domain([Math.max.apply(null, this.withdrawal.map(d => d.amount)), 0])
            .range([0, height])
            .nice();
        this.yaxis = d3.axisLeft(this.yScale);
        this.xaxis = d3.axisBottom(this.xScale);
        this.xContainer = container.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(this.xaxis);
        this.yContainer = container.append("g").call(this.yaxis);
        this.bargroup = container.append("g");
        this.bargroup.selectAll("rect")
            .data(this.withdrawal, d => d.transaction_id)
            .enter()
            .append("rect")
            .attr("fill", function(d){return this.colorscale(d.category[0])}.bind(this))
            .attr('x', function(d){return this.xScale(d.transaction_id);}.bind(this))
            .attr('y', function (d) {return this.yScale(d.amount)}.bind(this))
            .attr('width', this.xScale.bandwidth())
            .attr('height', function (d) {return Math.abs(this.yScale(d.amount) - this.yScale(0))}.bind(this));

        this.attachevent();
        // function for how to sort grouped data
        this.groupsortfn = (a, b)=> new Date(a.date).getTime() - new Date(b.date).getTime();
        // function for how to sort all grouped data
        this.allsortfn = null;

    }
    detachevent(){
        // detach rectangle callback
        this.bargroup.selectAll("rect")
            .on("mouseover", null)
            .on("mouseout", null)
            .on("click", null)
    }

    attachevent(){
        // attach event listeners to the rectangles
        this.bargroup.selectAll("rect")
            .on("mouseover",
                function(d) {
                    console.log("mouseover");
                    d3.selectAll("rect")
                        .filter( function (data) {
                            return this.currentlevel.callback(data) === this.currentlevel.callback(d)
                        }.bind(this))
                        .attr("x", function(d){
                            return parseInt(d3.select(this).attr("x")) - 10;
                        })
                        .attr("width", function(d){
                            return parseInt(d3.select(this).attr("width")) + 20 ;
                        });
                    //tooltip.transition()
                    //    .duration(200)
                    //     .style("opacity", .9);
                    //tooltip.html("DAN LOK")
                    //    .style("left", (d3.event.pageX) + "px")
                    //    .style("top", (d3.event.pageY - 28) + "px");

                }.bind(this))
            .on("mouseout", function(d) {
                console.log("mouseout");
                d3.selectAll("rect")
                    .filter( function (data) {
                        return this.currentlevel.callback(data) === this.currentlevel.callback(d)
                    }.bind(this))
                    .attr("x", function(d){
                        return parseInt(d3.select(this).attr("x")) + 10;
                    })
                    .attr("width", function(d){
                        return parseInt(d3.select(this).attr("width")) - 20
                    });
            }.bind(this))
    }

    enter(){
        this.bargroup.selectAll("rect")
            .style("opacity", 1)
            .attr("y", this.height)
            .attr("height", 0)
            .transition()
            .duration(1000)
            .attr('y', function (d) {return this.yScale(d.end)}.bind(this))
            .attr('height', function (d){return Math.abs(this.yScale(d.start) - this.yScale(d.end))}.bind(this));
        this.xContainer
            .transition(1000)
            .style("opacity", 1);
        this.yContainer
            .transition(1000)
            .style("opacity", 1);
        this.instant = false;
        this.hidden = false;
        this.attachevent();

    }

    exit(){
        this.bargroup.selectAll("rect")
            .transition()
            .duration(1000)
            .attr("y", this.height)
            .attr("height", 0)
            .on("end", function(d){d3.select(this).style("opacity", 0)});
        this.xContainer
            .transition(1000)
            .style("opacity", 0);
        this.yContainer
            .transition(1000)
            .style("opacity", 0);
        this.instant = true;
        this.hidden = true;
        this.detachevent()
    }




    gettransitiondomain(shiftup, groupcallback){
        // return a sorted domain to be shifted
        var sortfn = this.allsortfn;
        var transitiondomain = [];
        var currentcallback = this.currentlevel.callback;
        d3.nest()
            .key(shiftup ? groupcallback : currentcallback)
            .entries(this.withdrawal)
            .sort((a,b) => sortfn(a.values, b.values))
            .forEach(function(v){
                v.values.sort(this.groupsortfn);
                transitiondomain = transitiondomain.concat(v.values.map(d => shiftup ? currentcallback(d) : groupcallback(d)))
            }.bind(this));
        return [...new Set(transitiondomain)];

    }

    shiftdomain(newdomain, delay = 0, instant = false){
        var groupcallback = this.currentlevel.callback;
        let instantswitch = function(d){return instant ? 0 : d};
        this.xScale.domain(newdomain);
        this.xaxis.scale(this.xScale);
        this.xContainer
            .transition()
            .duration(instantswitch(1000))
            .delay(instantswitch(delay))
            .call(this.xaxis);

        this.bargroup.selectAll("rect")
            .data(this.withdrawal, d => d.transaction_id)
            .transition()
            .duration(instantswitch(1000))
            .delay(instantswitch(delay))
            .attr('x', function (d) {return this.xScale(groupcallback(d))}.bind(this))

    }

    shift(level){
        console.log("level recieved within", level);
        // reorganize data with the new coordinates
        var groupcallback = level.callback;
        var withdrawal = this.withdrawal;
        var sortfn = this.allsortfn;
        var groupsortfn = this.groupsortfn;
        if (level.code === this.currentlevel.code) return;
        console.log(
            groupcallback,
            withdrawal,
            sortfn,
            groupsortfn
        );
        // assign new y value to the data
        d3.nest()
            .key(groupcallback)
            .rollup(function(v){
                var start = 0;
                v.sort(groupsortfn);
                v.forEach(function(d){
                    let data = withdrawal.filter(f => f.transaction_id === d.transaction_id)[0];
                    data.start = start;
                    data.end = start + data.amount;
                    start += data.amount;
                });
            }).entries(withdrawal);
        var shiftup = level.code > this.currentlevel.code;
        // generated reorganized coordinates
        // use xtrans because timing may be different depending on if graph is sorted
        var newXdomain = d3.nest()
            .key(groupcallback)
            .entries(this.withdrawal);
        if (this.allsortfn !== null) {
            newXdomain.sort((a, b) => sortfn(a.values, b.values));
            var transitiondomain = this.gettransitiondomain(shiftup, groupcallback);
        }
        newXdomain = newXdomain.map(d => d.key).reverse();

        var xtransdelay = 0;
        var ytransdelay = 0;
        var bartransdelay = 0;

        if (this.instant){
            this.yScale.domain([Math.max.apply(null, withdrawal.map(d => d.end)),0]).nice();
            this.xScale.domain(newXdomain);
            this.xaxis.scale(this.xScale);
            this.yaxis.scale(this.yScale);
            this.xContainer
                .call(this.xaxis);
            this.yContainer
                .call(this.yaxis);
            this.bargroup.selectAll("rect")
                .data(withdrawal, d => d.transaction_id)
                .attr('y', function (d) {return this.yScale(d.end)}.bind(this))
                .attr('height', function (d){return Math.abs(this.yScale(d.start) - this.yScale(d.end))}.bind(this))
                .attr('x', function (d) {return this.xScale(groupcallback(d))}.bind(this))
                .attr('width', this.xScale.bandwidth());
            this.currentlevel = level;
        } else if (shiftup){
            console.log("shiftup");
            if (this.allsortfn !== null ){
                this.shiftdomain(transitiondomain);
                //i have no idea why we need to reverse the x domain here
                newXdomain.reverse();
                xtransdelay   += 1000;
                ytransdelay   += 1000;
                bartransdelay += 1000;
            }
            this.yScale.domain([Math.max.apply(null, withdrawal.map(d => d.end)),0]).nice();
            this.xScale.domain(newXdomain);
            this.xaxis.scale(this.xScale);
            this.yaxis.scale(this.yScale);
            this.xContainer
                .transition()
                .duration(1000)
                .delay(xtransdelay)
                .call(this.xaxis);

            this.yContainer.transition()
                .delay(1000 + ytransdelay)
                .duration(1000)
                .call(this.yaxis);

            this.bargroup.selectAll("rect")
                .data(withdrawal, d => d.transaction_id)
                .transition()
                .delay(bartransdelay)
                .duration(1000)
                .attr('y', function (d) {return this.yScale(d.end)}.bind(this))
                .attr('height', function (d){return Math.abs(this.yScale(d.start) - this.yScale(d.end))}.bind(this))
                .transition()
                .duration(1000)
                .attr('x', function (d) {return this.xScale(groupcallback(d))}.bind(this))
                .attr('width', this.xScale.bandwidth());

            this.currentlevel = level;
        } else {
            console.log('shiftdown');
            this.yScale.domain([Math.max.apply(null, withdrawal.map(d => d.end)),0]).nice();
            var newdomain = this.allsortfn !== null ? transitiondomain : newXdomain;
            this.xScale.domain(newdomain);
            this.xaxis.scale(this.xScale);
            this.yaxis.scale(this.yScale);
            this.xContainer.transition()
                .duration(1000)
                .call(this.xaxis);

            this.yContainer.transition()
                .delay(1000)
                .duration(1000)
                .call(this.yaxis);

            this.bargroup.selectAll("rect")
                .data(withdrawal, d => d.transaction_id)
                .transition()
                .duration(1000)
                .attr('x', function (d) {return this.xScale(groupcallback(d))}.bind(this))
                .attr('width', this.xScale.bandwidth())
                .transition()
                .duration(1000)
                .attr('y', function (d) {return this.yScale(d.end)}.bind(this))
                .attr('height', function (d){return Math.abs(this.yScale(d.start) - this.yScale(d.end))}.bind(this));

            this.currentlevel = level;
            if (this.allsortfn !== null){
                console.log("all sort function");
                this.sortdata_all(this.allsortfn, 2000);
            }
        }
        if (this.hidden){
            this.bargroup.selectAll("rect").style("opacity", 0)
        }
    }
    sortdata_all(sortfn, delay = 0, instant = false){
        // sort grouped data (daily, weekly, monthly, yearly)
        // sortfn will take in two array of the groups
        // a null input will cause the function to be sort chronologically (default)
        // delay will execute animation with optional second of delay
        var groupcallback = this.currentlevel.callback;
        var sorteddata = d3.nest()
            .key(groupcallback)
            .entries(this.withdrawal);
        if (sortfn !== null){
            sorteddata = sorteddata.sort((a,b) => sortfn(a.values, b.values))
        } else {
            // sort chronologically
            sorteddata.reverse();
        }
        this.shiftdomain(sorteddata.map(d => d.key), delay, instant);
        this.allsortfn = sortfn
    }

    sortdata_grouped(sortfn){
        console.log("sort grouped");
        // sort data within groups
        // sortfn with take two data inputs
        var groupcallback = this.currentlevel.callback;
        d3.nest()
            .key(groupcallback)
            .rollup(function(v){
                var start = 0;
                console.log(v);
                v.sort(sortfn);
                for (let d of v){
                    d.start = start;
                    d.end = start + d.amount;
                    start += d.amount;
                }
            }).entries(this.withdrawal);

        var group = this.bargroup.selectAll("rect")
            .data(this.withdrawal, d => d.transaction_id);
        for (let key of this.xScale.domain()){
            var groupdata = this.withdrawal.filter(d => groupcallback(d).toString() === key.toString());
            var groupcategory = [...new Set(groupdata.map(d => d.category[0]))];
            var start = this.xScale(key);
            var end = start + this.xScale.bandwidth();
            let scale = d3.scaleBand()
                .domain(groupcategory)
                .range([start, end])
                .padding(0.1);
            //seperate
            group.filter(d => groupcallback(d).toString() === key.toString())
                .transition()
                .duration(500)
                .attr("x", d => scale(d.category[0]))
                .attr("width", scale.bandwidth())
                .transition()
                .duration(500)
                .attr('y', function (d) {return this.yScale(d.end)}.bind(this))
                .attr('height', function (d){return Math.abs(this.yScale(d.start) - this.yScale(d.end))}.bind(this))
                .transition()
                .duration(500)
                .attr('x', function (d) {return this.xScale(groupcallback(d))}.bind(this))
                .attr('width', this.xScale.bandwidth())
        }
        this.groupsortfn = sortfn;
    }

    interchange(data, shiftup, duration = 1000, delay = 0){
        // switch data up and down
        var groupcallback = this.currentlevel.callback;
        var groupdata = this.withdrawal.filter(d => groupcallback(d) === groupcallback(data));
        var neighbor = shiftup ? groupdata.filter(d => data.end === d.start)[0] : groupdata.filter(d => data.start === d.end)[0];
        // reassign new coordinates
        var data_end = shiftup ? neighbor.end : data.end - neighbor.amount;
        var data_start = shiftup ? data.start + neighbor.amount : neighbor.start;
        var neighbor_end = shiftup ? data.start + neighbor.amount : data.end;
        var neighbor_start = shiftup ? data.start : data.end - neighbor.amount;
        [data.end, data.start, neighbor.end, neighbor.start] = [data_end, data_start, neighbor_end, neighbor_start];
        var group = this.bargroup.selectAll("rect")
            .data(this.withdrawal, d => d.transaction_id);
        group.filter(d => d.transaction_id === data.transaction_id)
            .call(function(){d3.select(this).raise()})
            .transition()
            .duration(duration)
            .delay(delay)
            .attr('y', function (d) {return this.yScale(d.end)}.bind(this))
            .attr('height', function (d){return Math.abs(this.yScale(d.start) - this.yScale(d.end))}.bind(this));

        group.filter(d => d.transaction_id === neighbor.transaction_id)
            .transition()
            .delay(delay)
            .attr('y', function (d) {return this.yScale(d.end)}.bind(this))
            .attr('height', function (d){
                return (
                    Math.abs(this.yScale(data.start) - this.yScale(data.end))
                    + Math.abs(this.yScale(d.start) - this.yScale(d.end))
                )
            }.bind(this))
            .transition()
            .delay(duration)
            .attr('height', function (d){return Math.abs(this.yScale(d.start) - this.yScale(d.end))}.bind(this));
    }
    switchscale(scale){
        this.yScale = scale;
        this.yaxis.scale(this.yScale);
        this.yContainer
            .transition()
            .duration(1000)
            .call(this.yaxis);
        this.bargroup.selectAll("rect")
            .transition()
            .duration(1000)
            .attr('y', function(d) {return this.yScale(d.end)}.bind(this))
            .attr('height', function (d){return Math.abs(this.yScale(d.start) - this.yScale(d.end))}.bind(this));
    }

    updatedata(filterfn){
        // removes old data and introduce new one using a filterfn
        // a filter fn will filter out all the unwanted data
        var groupcallback = this.currentlevel.callback;
        var withdrawal = this.withdrawal;
        var newdata = this.original_data.filter(filterfn);
        var groupsortfn = this.groupsortfn;
        // animate exiting elements
        // calculate exit coordinates
        if (!this.instant) {
            d3.nest()
                .key(groupcallback)
                .rollup(function (v) {
                    var start = 0;
                    v.sort(groupsortfn);
                    v.forEach(function (d) {
                        let exited = true;
                        let data = withdrawal.filter(f => f.transaction_id === d.transaction_id)[0];
                        for (let data_n of newdata) {
                            if (data_n.transaction_id === d.transaction_id) {
                                exited = false;
                                break;
                            }
                        }
                        if (exited) {
                            data.start = start;
                            data.end = start;
                        } else {
                            data.start = start;
                            data.end = start + data.amount;
                            start += data.amount;
                        }
                    });
                }).entries(withdrawal);
            var updated = this.bargroup.selectAll("rect").data(withdrawal, d => d.transaction_id);
            updated.transition()
                .duration(1000)
                .attr('x', function (d) {
                    return this.xScale(groupcallback(d))
                }.bind(this))
                .attr('width', this.xScale.bandwidth())
                .attr('y', function (d) {
                    return this.yScale(d.end)
                }.bind(this))
                .attr('height', function (d) {
                    return Math.abs(this.yScale(d.start) - this.yScale(d.end))
                }.bind(this));
        }
        // calculated enter data beginning
        d3.nest()
            .key(groupcallback)
            .rollup(function(v){
                var start_enter = 0;
                var start = 0;
                v.sort(groupsortfn);
                v.forEach(function(d){
                    let entered = true;
                    let data = newdata.filter(f => f.transaction_id === d.transaction_id)[0];
                    for (let data_n of withdrawal){
                        if (data_n.transaction_id === d.transaction_id){
                            entered = false;
                            break;
                        }
                    }
                    data.start = start;
                    data.end = start + data.amount;
                    start += data.amount;
                    if (entered){
                        data.start_enter = start_enter;
                        data.end_enter = start_enter;
                    } else {
                        data.start_enter = start_enter;
                        data.end_enter = start_enter + data.amount;
                        start_enter += data.amount;
                    }
                });
            }).entries(newdata);

        var entered = this.bargroup.selectAll("rect").data(newdata, d => d.transaction_id);
        // remove exiting element from DOM

        if (this.instant) {
            entered.exit().remove()
        } else {
            entered.exit()
                .transition()
                .delay(1000)
                .remove();

        }
        if (this.allsortfn != null){
            var sortfn = this.allsortfn;
            var newdomain = d3.nest()
                .key(groupcallback)
                .entries(newdata)
                .sort((a,b) => sortfn(a.values, b.values))
                .map(d => d.key)
                .reverse();//I am not sure why again
            console.log(newdomain)
        } else {
            var newdomain = newdata.map(groupcallback)
        }
        this.xScale.domain([...new Set(newdomain)].reverse());
        this.xaxis.scale(this.xScale);
        this.yScale.domain([Math.max.apply(null, newdata.map(d => d.end)),0]).nice();
        this.yaxis.scale(this.yScale);
        var entereddata = entered.enter()
                                 .append("rect");


        let instantswitch = function(d){return this.instant ? 0 : d}.bind(this);
        this.xContainer.transition()
            .delay(instantswitch(1000))
            .duration(instantswitch(1000))
            .call(this.xaxis);
        this.yContainer.transition()
            .delay(instantswitch(1000))
            .duration(instantswitch(1000))
            .call(this.yaxis);

        entereddata.attr("fill", function (d) {
                return this.colorscale(d.category[0])
            }.bind(this))
            .attr('x', function (d) {
                return this.xScale(groupcallback(d))
            }.bind(this))
            .attr('width', this.xScale.bandwidth())
            .attr('y', function (d) {
                return this.yScale(d.end_enter)
            }.bind(this))
            .attr('height', 0)
            .transition()
            .delay(instantswitch(2000))
            .duration(instantswitch(1000))
            .attr('y', function (d) {
                return this.yScale(d.end)
            }.bind(this))
            .attr('height', function (d) {
                return Math.abs(this.yScale(d.start) - this.yScale(d.end))
            }.bind(this));

        entered
            .transition()
            .delay(instantswitch(1000))
            .duration(instantswitch(1000))
            .attr('x', function (d) {
                return this.xScale(groupcallback(d))
            }.bind(this))
            .attr('width', this.xScale.bandwidth())
            .attr('y', function (d) {
                return this.yScale(d.end_enter)
            }.bind(this))
            .attr('height', function (d) {
                return Math.abs(this.yScale(d.start_enter) - this.yScale(d.end_enter))
            }.bind(this))
            .transition()
            .duration(instantswitch(1000))
            .attr('y', function (d) {
                return this.yScale(d.end)
            }.bind(this))
            .attr('height', function (d) {
                return Math.abs(this.yScale(d.start) - this.yScale(d.end))
            }.bind(this));

        this.withdrawal = newdata;
        this.allcategory = [...new Set(this.withdrawal.map(function (d) {
            return this.colorcallback(d)
        }.bind(this)))];
        this.legend = this.allcategory.map(function (d) {
            return {
                color: this.colorscale(d),
                labels: d
            }
        }.bind(this));
        // for later use
        // exports.publish(this.generatedevent.legendchange, this.legend);
        // sort data after transition
        if (this.hidden){
            this.container.selectAll("rect").style("opacity", 0)
        }
        if (this.allsortfn !== null){
           // this.sortdata_all(this.allsortfn, 4000);
        }
    }
}

// week number function
Date.prototype.getWeekNumber = function(){
    var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
    var dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7)
};

// static barchart variables
var barchartlevels = {
    bytransaction: {code: 0, callback:d => d.transaction_id},
    daily: {code:1, callback: d => d.date},
    weekly: {code:2, callback: d => new Date(d.date).getWeekNumber()},
    monthly: {code:3, callback: d => new Date(d.date).getMonth()},
};
//barchart.generatedevent = {
//    legendchange : 0
//};

export {
    barchart,
    barchartlevels
};
