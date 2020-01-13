import React from 'react';
import './App.css';
import {barchart, barchartlevels} from './simplechart'
import {piechart} from './piechart.js'
import financial from "./test";
import Button from '@material-ui/core/Button';
import SortIcon from '@material-ui/icons/Sort';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TablePagination from '@material-ui/core/TablePagination';

import MaterialTable from 'material-table'
import DateRangeIcon from '@material-ui/icons/DateRange'
import Chip from '@material-ui/core/Chip';
import FilterRow from 'material-table'
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import MTableToolbar from 'material-table';
import DateRangePicker from 'react-bootstrap-daterangepicker';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-daterangepicker/daterangepicker.css';
import Input from '@material-ui/core/Input';
import moment from 'moment';
import Fade from 'react-reveal/Fade';
import "./chart.css";
import * as d3 from "d3";



class Barchart extends React.Component {

    constructor(){
        super();
        this.tableElement = React.createRef();
        this.columnid2name = {
            0 : "date",
            1 : "name",
            2 : "amount",
            3 : "category"
        };
        this.state = {chartstate: 'bar', // the state of the chart whether it is in bar format or pie format
                      scalelabel: "Linear",
                      masterdata: null, // master data is never modify
                      displaydata: null, // the data being physically display
                      displaydataformated: null, // the display data formated for nested purposes
                      level: 0, //keeps track of the grouping function
                      tabledetails: null, //table details panel for formatting
                      //filterfn: null,
                      showbutton: true, // boolean tracking whether the top 4 button (transaction, daily etc) is shown
                      isDateOpen: false,// track if datepicker is open
                      chart: null, // barchart
                      piechart: null, // piechart
                      page : 0, // deprecated
                      rowperpage : 5, // deprecated
                      dateRange: "Enter Date", // date range display by table
                      anchorEl: null,
                      anchorElScale: null,
                      startdate: moment(),
                      enddate: moment(),
                      defaulttableheader: [
                          { title: 'Date', field: 'date',
                          },
                          { title: 'Name', field: 'name'},
                          { title: 'Amount', field: 'amount'},
                          { title: 'Category', field: 'category'}
                      ],
                      tableheader: [
                          { title: 'Date', field: 'date',
                          },
                          { title: 'Name', field: 'name'},
                          { title: 'Amount', field: 'amount'},
                          { title: 'Category', field: 'category'}
                      ],
                      sortByLabel: "chronological"//keeps track of the sorting format
        };
    }

    componentDidMount() {
        var el1 = document.getElementById('chart');
        var el2 = document.getElementById('piechart');
        //this.interval = setInterval(() => {console.log(this.tableElement)}, 100);
        // temporary solution
        let width = 700;
        let height = 500;
        var margin = {top: 20, right: 20, bottom: 20, left: 50};
        var container1 = d3.select(el1)
                          .append("svg")
                          .attr("width", width + margin.left + margin.right)
                          .attr("height", height + margin.top + margin.bottom)
                          .append("g")
                          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        var container2 = d3.select(el2)
                          .append("svg")
                          .attr("width", width + margin.left + margin.right)
                          .attr("height", height + margin.top + margin.bottom)
                          .append("g")
                          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        var bchart = new barchart(financial.transactions, container1, 700, 500);
        var pchart = new piechart(financial.transactions, container2, 100, 200);

        let category = [...new Set(financial.transactions.map(d => d.category[0]))];
        this.category2id = {};
        this.id2category = {};
        category.forEach(function(v, i){
            this.category2id[v] = i;
            this.id2category[i] = v;
        }.bind(this));
        let name = [...new Set(financial.transactions.map(d => d.name))];
        this.name2id = {};
        this.id2name = {};
        name.forEach(function(v, i){
            this.name2id[v] = i;
            this.id2name[i] = v;
        }.bind(this));


        //console.log(category2id, id2category);
        //var pie = new piechart(financial.transactions.slice(0, 10), el2, 700, 500);
        let  startdate = moment(financial.transactions.slice(-1)[0].date,'YYYY-MM-DD');
        let  enddate =  moment(financial.transactions[0].date, 'YYYY-MM-DD');
        //map number to category


        this.setState({chart: bchart,
                             piechart: pchart,
                             level: barchartlevels.bytransaction,
                             masterdata: financial.transactions.filter(d => d.amount > 0).reverse(),
                             displaydata: financial.transactions.filter(d => d.amount > 0).map(function(d){
                                 return {'date': d.date,
                                         'name': this.name2id[d.name],
                                         'amount' : d.amount,
                                         'category' : this.category2id[d.category[0]],
                                         'transactionid': d.transaction_id}
                             }.bind(this)).reverse(),
                             displaydataformated: financial.transactions.filter(d => d.amount > 0).map(function(d){
                                 return {'date': d.date,
                                     'name': this.name2id[d.name],
                                     'amount' : d.amount,
                                     'category' : this.category2id[d.category[0]],
                                     'transactionid': d.transaction_id}
                             }.bind(this)).reverse(),
                            defaulttableheader: [
                                { title: 'Date', field: 'date'},
                                { title: 'Name', field: 'name',  sorting: false, lookup: this.id2name},
                                { title: 'Amount', field: 'amount'},
                                { title: 'Category', field: 'category',  sorting: false, lookup: this.id2category}
                            ],
                            tableheader: [
                                { title: 'Date', field: 'date'},
                                { title: 'Name', field: 'name',  sorting: false, lookup: this.id2name},
                                { title: 'Amount', field: 'amount'},
                                { title: 'Category', field: 'category',  sorting: false, lookup: this.id2category}
                            ],
                             startdate: startdate,
                             enddate: enddate,
                             dateRange: startdate.format('MM/DD/YYYY') + ' - ' + enddate.format('MM/DD/YYYY')
        });
        pchart.enter();
    }

    handleClick(level){
        console.log("HANDLE CLICK STATE");
        console.log(this.state.defaulttableheader);
        let tableheader;
        let id2cat = this.id2category;
        let id2name = this.id2name;
        if ( 0 < level.code && level.code <= 3) {
            tableheader = [{title: "Date", field : "key"},
                           {title: "Amount",  field : "amount"}];
            if ( this.state.chart.sortorder.orderedColumnId === "date"){
                tableheader[0].defaultSort = this.state.chart.sortorder.orderDirection;
            }
            if ( this.state.chart.sortorder.orderedColumnId === "amount"){
                tableheader[1].defaultSort = this.state.chart.sortorder.orderDirection;
            }
            this.columnid2name = {
                0 : "date",
                1 : "amount"
            }
        } else if ( 4 === level.code ) {
            tableheader = [{title: "Category", field: "key", sorting: false, lookup: id2cat},
                           { title: 'Amount', field: 'amount'}];

            if ( this.state.chart.sortorder.orderedColumnId === "category"){
                tableheader[0].defaultSort = this.state.chart.sortorder.orderDirection;
            }
            if ( this.state.chart.sortorder.orderedColumnId === "amount"){
                tableheader[1].defaultSort = this.state.chart.sortorder.orderDirection;
            }
        } else if ( 5 === level.code) {
            tableheader = [{title: "Name", field: "key", sorting: false, lookup: id2name},
                           { title: 'Amount', field: 'amount'}];
            if ( this.state.chart.sortorder.orderedColumnId === "name"){
                tableheader[0].defaultSort = this.state.chart.sortorder.orderDirection;
            }
            if ( this.state.chart.sortorder.orderedColumnId === "amount"){
                tableheader[1].defaultSort = this.state.chart.sortorder.orderDirection;
            }
            this.columnid2name = {
                0 : "name",
                1 : "amount"
            }
        } else {
            tableheader = this.state.defaulttableheader;
            if ( this.state.chart.sortorder.orderedColumnId === "date"){
                tableheader[0].defaultSort = this.state.chart.sortorder.orderDirection;
            } else if ( this.state.chart.sortorder.orderedColumnId === "name"){
                tableheader[1].defaultSort = this.state.chart.sortorder.orderDirection;
            } else if ( this.state.chart.sortorder.orderedColumnId === "amount"){
                tableheader[2].defaultSort = this.state.chart.sortorder.orderDirection;
            } else if ( this.state.chart.sortorder.orderedColumnId === "category"){
                tableheader[3].defaultSort = this.state.chart.sortorder.orderDirection;
            }
            this.columnid2name = {
                0 : "date",
                1 : "name",
                2 : "amount",
                3 : "category"
            };
        }
        this.setState({level: level,
                             //reformat display data
                             displaydataformated: level.code !== 0 ? d3.nest()
                                             .key(level.code === 4 ? d => d.category : level.callback) // make an expection to sort by category as the callback function doesnt return correct label
                                             .rollup(function(v){
                                                return {
                                                    data: v,
                                                    sum: Math.round(d3.sum(v, d => d.amount) * 100) / 100
                                             }})
                                             .entries(this.state.displaydata)
                                             .map((d) => ({
                                                 'key': d.key,
                                                 'amount': d.value.sum,
                                                 'data': d.value.data
                                             })) : this.state.displaydata,
                             tableheader: tableheader,
                             tabledetails: level.code !== 0 ? [{
                                 tooltip: 'Expand',
                                 render: function(rowData){
                                     return (
                                         <MaterialTable
                                             columns={[
                                                 { title: 'Date', field: 'date',
                                                 },
                                                 { title: 'Name', field: 'name'},
                                                 { title: 'Amount', field: 'amount'},
                                                 { title: 'Category', field: 'category'}
                                             ]}
                                             data={rowData.data}
                                             options={{search: false,
                                                       toolbar: false,
                                                       filtering: false}}
                                         />)
                                 }}] : null
        });
        this.handleMenuClose();
    }

    componentDidUpdate() {
        if (this.state.chartstate === "bar_enter"){
            // exit animation for pie chart
            this.state.piechart.exit();
            // enter animation for bar chart
            this.state.chart.enter();
            // set state to normal bar chart
            this.setState({chartstate: "bar"})
        } else if (this.state.chartstate === "pie_enter"){
            // exit animation for bar chart
            this.state.chart.exit();
            // enter animation for pie chart
            this.state.piechart.enter();
            // set state to normal pie chart
            this.setState({chartstate: "pie"})
        }
        if (this.state.level.code > 3 || this.state.chart.currentlevel.code > 3){
            console.log("groupshift");
            this.state.chart.groupshift(this.state.level);
        } else {
            //shift the chart
            this.state.chart.shift(this.state.level);
        }

    }
    handleDateChange(event, picker){
        let cat2id = this.category2id;
        let name2id = this.name2id;

        let filterfn = function(d){
            let date = moment(d.date, 'YYYY-MM-DD');
            return picker.startDate.isSameOrBefore(date)
                && picker.endDate.isSameOrAfter(date)
        };
        this.setState({dateRange: picker.startDate.format('MM/DD/YYYY') + ' - ' + picker.endDate.format('MM/DD/YYYY'),
                             startdate: picker.startDate,
                             enddate: picker.endDate,
                             displaydata: this.state.masterdata.filter(filterfn).map(function(d){
                                 return {'date': d.date,
                                     'name': name2id[d.name],
                                     'amount' : d.amount,
                                     'category' : cat2id[d.category[0]]}
                             })});
        //handle change in barchart
        this.state.chart.updatedata(filterfn);
        //handle change in piechart
        this.state.piechart.updatedata(filterfn);

        console.log("display data", this.state.displaydata);
        this.setState({displaydataformated: this.state.level.code !== 0 ? d3.nest()
                                                                                  .key(this.state.level.code === 4 ? d => d.category : this.state.level.callback)
                                                                                  // make an expection to sort by category as the callback function doesnt return correct label
                                                                                  .rollup(function(v){
                                                                                    return {
                                                                                        data: v,
                                                                                        sum: Math.round(d3.sum(v, d => d.amount) * 100) / 100
                                                                                    }})
                                                                                  .entries(this.state.displaydata)
                                                                                  .map(d => ({
                                                                                    'key': d.key,
                                                                                    'amount': d.value.sum,
                                                                                    'data': d.value.data
                                                                                  })) : this.state.displaydata});

        console.log("display state", this.state);


    }


    handleMenuOpen (event) {
        this.setState({anchorEl: event.currentTarget});
    }

    handleMenuClose() {
        this.setState({anchorEl: null});
    }

    handleMenuScaleClose() {
        this.setState({anchorElScale: null});
    }

    handleMenuScaleOpen (event) {
        this.setState({anchorElScale: event.currentTarget});
    }

    handleClickScale(scale, name){
        this.state.chart.switchscale(scale);
        this.setState({scalelabel: name});
        this.handleMenuScaleClose();
    }

    render() {

        // daterange component (maybe move to another file for refactoring)

        let daterange = null;

        return (
                    <div>
                        <div style={{display: "inline-block"}} id={"chart"}>
                        </div>
                        <div style={{display: "inline-block"}} id={"piechart"}>
                        </div>
                        {/*
                                                            <Menu
                                        anchorEl={this.state.anchorEl}
                                        onClose={this.handleMenuClose.bind(this)}
                                        open={Boolean(this.state.anchorEl)}
                                    >
                                        <MenuItem
                                            value="Chronological"
                                            onClick={this.handleMenuClose.bind(this, "Chronological")}>Chronological</MenuItem>
                                        <MenuItem
                                            value="Min to Max"
                                            onClick={this.handleMenuClose.bind(this, "Min to Max")}>Min to Max</MenuItem>
                                    </Menu>
                                    style={{width: "1000px",  margin: "0 auto"}}
                        */}
                        <div style={{width: "1500px",  margin: "0 auto"}}>

                            <Menu
                                anchorEl={this.state.anchorEl}
                                onClose={this.handleMenuClose.bind(this)}
                                open={Boolean(this.state.anchorEl)}>
                                <MenuItem onClick={this.handleClick.bind(this,barchartlevels.bytransaction)}>Transaction</MenuItem>
                                <MenuItem onClick={this.handleClick.bind(this,barchartlevels.daily)}>Day</MenuItem>
                                <MenuItem onClick={this.handleClick.bind(this,barchartlevels.weekly)}>Week</MenuItem>
                                <MenuItem onClick={this.handleClick.bind(this,barchartlevels.monthly)}>Month</MenuItem>
                                <MenuItem onClick={this.handleClick.bind(this,barchartlevels.category)}>Category</MenuItem>
                                <MenuItem onClick={this.handleClick.bind(this,barchartlevels.name)}>Name</MenuItem>
                            </Menu>
                            <Menu
                                anchorEl={this.state.anchorElScale}
                                onClose={this.handleMenuScaleClose.bind(this)}
                                open={Boolean(this.state.anchorElScale)}>
                                <MenuItem onClick={this.handleClickScale.bind(this, d3.scaleLinear(), "Linear")}>Linear</MenuItem>
                                <MenuItem onClick={this.handleClickScale.bind(this, d3.scaleSymlog(), "Log")}>Logarithmic</MenuItem>
                            </Menu>
                            <MaterialTable
                                tableRef={this.tableElement}
                                key={JSON.stringify(this.state.level)}
                                columns={this.state.tableheader}
                                data={this.state.chart ? this.state.displaydataformated : null}
                                title={<div>
                                            {"Expenses from "}
                                            <DateRangePicker
                                                onApply={this.handleDateChange.bind(this)}
                                                locale={{
                                                    format: 'YYYY-MM-DD'
                                                }}
                                                startDate={this.state.startdate.format('YYYY-MM-DD')}
                                                endDate={this.state.enddate.format('YYYY-MM-DD')}
                                                opens="right">
                                                <Chip clickable={true} label={this.state.dateRange}/>
                                            </DateRangePicker>
                                            {" Group By: "}
                                            <Chip clickable={true} onClick={function(event){this.handleMenuOpen(event)}.bind(this)} label={this.state.level.name}/>
                                            {" Scaled used: "}
                                            <Chip clickable={true} onClick={function(event){this.handleMenuScaleOpen(event)}.bind(this)} label={this.state.scalelabel}/>

                                        </div>}
                                detailPanel={this.state.tabledetails}
                                options={{filtering: true,
                                          toolbarButtonAlignment: "left"}}
                                onOrderChange={function(orderedColumnId, orderDirection) {
                                    let sortorder = {
                                        orderDirection: orderDirection,
                                        orderedColumnId: this.columnid2name[orderedColumnId]
                                    };
                                    // we do not change chart if the table order is the same as the chart
                                    if (this.state.chart.sortorder.orderDirection !== orderDirection
                                        || this.state.chart.sortorder.orderedColumnId !== orderedColumnId) {
                                        if (orderedColumnId === 0) {
                                            if (orderDirection === "asc") {
                                                this.state.chart.sortdata_all(null, sortorder);
                                            } else if (orderDirection === "desc") {
                                                this.state.chart.sortdata_all((a, b) => -1, sortorder);
                                            }
                                        } else if (orderedColumnId === 2 || (orderedColumnId === 1 && this.state.level.code > 0)) {
                                            if (orderDirection === "asc") {
                                                this.state.chart.sortdata_all((a, b) => {
                                                    return d3.sum(a, a => a.amount) - d3.sum(b, b => b.amount);
                                                }, sortorder);
                                            } else if (orderDirection === "desc") {
                                                this.state.chart.sortdata_all((a, b) => {
                                                    return d3.sum(b, b => b.amount) - d3.sum(a, a => a.amount);
                                                }, sortorder);
                                            }
                                        } else if (orderedColumnId === -1){
                                            //if order column id is -1 we reset back to normal which is asc 0
                                            this.state.chart.sortdata_all(null, {
                                                orderDirection: "asc",
                                                orderedColumnId: "date"
                                            });
                                        }
                                    }
                                    // retain order of operations between tables
                                }.bind(this)}
                            />
                        </div>
                    </div>
        )
    }
}


export default Barchart;