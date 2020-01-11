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
        this.iconElement = React.createRef();
        this.menuElement = React.createRef();
        this.state = {chartstate: 'bar', // the state of the chart whether it is in bar format or pie format
                      masterdata: null, // master data is never modify
                      displaydata: null, // the data being physically display
                      displaydataformated: null, // the display data formated for nested purposes
                      level: 0, //keeps track of the grouping function
                      tabledetails: null, //table details panel for formatting
                      //filterfn: null,
                      showbutton: true, // boolean tracking whether the top 4 button (transaction, daily etc) is shown
                      chart: null, // barchart
                      piechart: null, // piechart
                      page : 0, // deprecated
                      rowperpage : 5, // deprecated
                      dateRange: "Enter Date", // date range display by table
                      anchorEl: null,
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
        var el = document.getElementById('chart');
        //this.interval = setInterval(() => {
        //    if (this.state.chart.sortorder === 2000){
        //        console.log("---START HERE---");
        //        console.log({...this.state.chart});
        //    }
        //    console.log({...this.state.chart});
        //}, 10);
        // temporary solution
        let width = 700;
        let height = 500;
        var margin = {top: 20, right: 20, bottom: 20, left: 30};
        var container = d3.select(el)
                          .append("svg")
                          .attr("width", width + margin.left + margin.right)
                          .attr("height", height + margin.top + margin.bottom)
                          .append("g")
                          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        var bchart = new barchart(financial.transactions, container, 700, 500);
        var pchart = new piechart(financial.transactions, container, 100, 200);
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
                                         'name': d.name,
                                         'amount' : d.amount,
                                         'category' : d.category[0],
                                         'transactionid': d.transaction_id}
                             }).reverse(),
                             displaydataformated: financial.transactions.filter(d => d.amount > 0).map(function(d){
                                 return {'date': d.date,
                                     'name': d.name,
                                     'amount' : d.amount,
                                     'category' : d.category[0],
                                     'transactionid': d.transaction_id}
                             }).reverse(),
                            defaulttableheader: [
                                { title: 'Date', field: 'date'},
                                { title: 'Name', field: 'name'},
                                { title: 'Amount', field: 'amount'},
                                { title: 'Category', field: 'category'}
                            ],
                            tableheader: [
                                { title: 'Date', field: 'date'},
                                { title: 'Name', field: 'name'},
                                { title: 'Amount', field: 'amount'},
                                { title: 'Category', field: 'category'}
                            ],
                             startdate: startdate,
                             enddate: enddate,
                             dateRange: startdate.format('MM/DD/YYYY') + ' - ' + enddate.format('MM/DD/YYYY')
        });
    }

    handleClick(level){
        console.log("HANDLE CLICK STATE");
        console.log(this.state.defaulttableheader);
        this.setState({level: level,
                             //reformat display data
                             displaydataformated: level.code !== 0 ? d3.nest()
                                             .key(level.callback)
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
                                             })) : this.state.displaydata,
                             tableheader: level.code !== 0 ? [
                                 {title: "Date", field : "key", defaultSort: this.state.chart.sortorder.orderedColumnId === 0 ? this.state.chart.sortorder.orderDirection : ""},
                                 {title: "Amount",  field : "amount", defaultSort: this.state.chart.sortorder.orderedColumnId === 2 ? this.state.chart.sortorder.orderDirection : ""}]
                                 : this.state.defaulttableheader,
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

    handleChangePage(event, newpage){
        this.setState( {page: newpage})
    }

    handleRowChange(event) {
        this.setState({rowperpage: event.target.value})
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
        //shift the chart
        this.state.chart.shift(this.state.level);

        if (this.state.filterfn !== null) {
            // update the chart
            //update internal data representation
            //this.setState({displaydata: this.state.masterdata.filter(this.state.filterfn)});
        }
    }
    handleDateChange(event, picker){
        let filterfn = function(d){
            let date = moment(d.date, 'YYYY-MM-DD');
            return picker.startDate.isSameOrBefore(date)
                && picker.endDate.isSameOrAfter(date)
        };
        this.setState({dateRange: picker.startDate.format('MM/DD/YYYY') + ' - ' + picker.endDate.format('MM/DD/YYYY'),
                             displaydata: this.state.masterdata.filter(filterfn).map(function(d){
                                 return {'date': d.date,
                                     'name': d.name,
                                     'amount' : d.amount,
                                     'category' : d.category[0]}
                             })});
        //handle change in barchart
        this.state.chart.updatedata(filterfn);
        //handle change in piechart
        this.state.piechart.updatedata(filterfn);

        this.setState({displaydataformated: this.state.level.code !== 0 ? d3.nest()
                                                                                  .key(this.state.level.callback)
                                                                                  .rollup(function(v){
                                                                                    return {
                                                                                        data: v,
                                                                                        sum: Math.round(d3.sum(v, d => d.amount) * 100) / 100
                                                                                    }})
                                                                                  .entries(this.state.displaydata)
                                                                                  .map(d => ({
                                                                                    'key': d.key,
                                                                                    'sum': d.value.sum,
                                                                                    'data': d.value.data
                                                                                  })) : this.state.displaydata});

    }

    handleMenuOpen (event) {
        this.setState({anchorEl: event.currentTarget});
    }

    handleMenuClose() {
        this.setState({anchorEl: null});
    }


    render() {

        // daterange component (maybe move to another file for refactoring)

        let daterange = (
            <DateRangePicker
                onApply={this.handleDateChange.bind(this)}
                locale={{
                    format: 'YYYY-MM-DD'
                }}
                startDate={this.state.startdate.format('YYYY-MM-DD')}
                endDate={this.state.enddate.format('YYYY-MM-DD')}
                opens="right">
                {this.menuElement}
            </DateRangePicker>
        );

        return (
                    <div>
                        <div id={"chart"}>
                        </div>
                        <div>
                            <Fade when={this.state.showbutton}>
                                <ButtonGroup className={this.state.showbutton ? null : "nodisplay"}>
                                    <Button onClick={this.handleClick.bind(this,barchartlevels.bytransaction)} ref={this.menuElement}>Transaction</Button>
                                    <Button onClick={this.handleClick.bind(this,barchartlevels.daily)}>Daily</Button>
                                    <Button onClick={this.handleClick.bind(this,barchartlevels.weekly)}>Weekly</Button>
                                    <Button onClick={this.handleClick.bind(this,barchartlevels.monthly)}>Monthly</Button>
                                </ButtonGroup>
                            </Fade>
                        </div>
                        <div>
                            <Button onClick={function(){
                                            // don't do anything if it is a pie chart
                                            if (this.state.chartstate !== "pie") {
                                                this.setState( {showbutton: false});
                                                this.setState({chartstate: "pie_enter"});
                                            }
                            }.bind(this)}>
                                Pie Chart
                            </Button>
                            <Button onClick={function(){
                                            if (this.state.chartstate !== "bar"){
                                                this.setState( {showbutton: true});
                                                this.setState({chartstate: "bar_enter"});
                                            }
                            }.bind(this)} id="daterange">
                                BarChart
                            </Button>
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
                        */}
                        <div>
                            <Menu
                                anchorEl={this.state.anchorEl}
                                onClose={this.handleMenuClose.bind(this)}
                                open={Boolean(this.state.anchorEl)}>
                                <MenuItem onClick={this.handleClick.bind(this,barchartlevels.bytransaction)}>Transaction</MenuItem>
                                <MenuItem onClick={this.handleClick.bind(this,barchartlevels.daily)}>Daily</MenuItem>
                                <MenuItem onClick={this.handleClick.bind(this,barchartlevels.weekly)}>Weekly</MenuItem>
                                <MenuItem onClick={this.handleClick.bind(this,barchartlevels.monthly)}>Monthly</MenuItem>
                            </Menu>

                            <MaterialTable
                                key={JSON.stringify(this.state.level)}
                                columns={this.state.tableheader}
                                data={this.state.chart ? this.state.displaydataformated : null}
                                title={<div>
                                    {"Expenses from "}
                                    <Chip label={this.state.dateRange}/>
                                    {" sort by: "}
                                    <Chip label={this.state.level.name}/>
                                </div>}
                                detailPanel={this.state.tabledetails}
                                options={{filtering: true}}
                                components={{
                                    Toolbar: props => (
                                        <div>
                                            <MTableToolbar {...props} />
                                            <div style={{padding: '0px 10px'}}>
                                                <Chip label="Chip 1" color="secondary" style={{marginRight: 5}}/>
                                                <Chip label="Chip 2" color="secondary" style={{marginRight: 5}}/>
                                                <Chip label="Chip 3" color="secondary" style={{marginRight: 5}}/>
                                                <Chip label="Chip 4" color="secondary" style={{marginRight: 5}}/>
                                                <Chip label="Chip 5" color="secondary" style={{marginRight: 5}}/>
                                            </div>
                                        </div>
                                    ),
                                }}
                                onOrderChange={function(orderedColumnId, orderDirection) {
                                    let sortorder = {
                                        orderDirection: orderDirection,
                                        orderedColumnId: orderedColumnId
                                    };
                                    // we do not change chart if the table order is the same as the chart
                                    if (this.state.chart.sortorder.orderDirection !== orderDirection
                                        || this.state.chart.sortorder.orderedColumnId !== orderedColumnId) {
                                        if (orderedColumnId === 0) {
                                            if (orderDirection === "asc") {
                                                this.state.chart.sortdata_all(null, { ...sortorder });
                                            } else if (orderDirection === "desc") {
                                                this.state.chart.sortdata_all((a, b) => -1, { ...sortorder });
                                            }
                                        } else if (orderedColumnId === 2 || (orderedColumnId === 1 && this.state.level.code > 0)) {
                                            if (orderDirection === "asc") {
                                                this.state.chart.sortdata_all((a, b) => {
                                                    return d3.sum(a, a => a.amount) - d3.sum(b, b => b.amount);
                                                }, { ...sortorder });
                                            } else if (orderDirection === "desc") {
                                                this.state.chart.sortdata_all((a, b) => {
                                                    return d3.sum(b, b => b.amount) - d3.sum(a, a => a.amount);
                                                }, { ...sortorder });
                                            }
                                        } else if (orderedColumnId === -1){
                                            //if order column id is -1 we reset back to normal which is asc 0
                                            this.state.chart.sortdata_all(null, {
                                                orderDirection: "asc",
                                                orderedColumnId: 0
                                            });
                                        }
                                    }
                                    // retain order of operations between tables
                                    this.setState({defaulttableheader : [
                                        { title: 'Date', field: 'date', defaultSort: this.state.chart.sortorder.orderedColumnId === 0 ? this.state.chart.sortorder.orderDirection : ""},
                                        { title: 'Name', field: 'name'},
                                        { title: 'Amount', field: 'amount', defaultSort: this.state.chart.sortorder.orderedColumnId === 1 ? this.state.chart.sortorder.orderDirection : ""},
                                        { title: 'Category', field: 'category'}
                                    ]})
                                }.bind(this)}
                            />

                            {/*actions={[{
                                    icon: () => <DateRangeIcon/>,
                                    isFreeAction: true,
                                    onClick: (event) => null
                                },
                                    {
                                        icon: function(){return <SortIcon/>}.bind(this),
                                        isFreeAction: true,
                                        onClick: function(event){this.handleMenuOpen(event)}.bind(this)
                                    }]}
                                 */}
                        </div>
                    </div>
        )
    }
}


export default Barchart;