import React from 'react';
import './App.css';
import {barchart, barchartlevels} from './simplechart'
import {piechart} from './piechart.js'
import financial from "./test";
import Button from '@material-ui/core/Button';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TablePagination from '@material-ui/core/TablePagination';

import MaterialTable from 'material-table'
import DateRangeIcon from '@material-ui/icons/DateRange'
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
        this.inputElement = React.createRef();
        this.state = {chartstate: 'bar', // the state of the chart whether it is in bar format or pie format
                      masterdata: null, // master data is never modify
                      displaydata: null, // the data being physically display
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
                      sortByLabel: "Chronological"
        };
    }

    componentDidMount() {
        var el = document.getElementById('chart');

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

        this.setState({chart: bchart,
                             piechart: pchart,
                             level: barchartlevels.bytransaction,
                             masterdata: financial.transactions.filter(d => d.amount > 0),
                             displaydata: financial.transactions.filter(d => d.amount > 0),
                             startdate: startdate,
                             enddate: enddate,
                             dateRange: startdate.format('MM/DD/YYYY') + ' - ' + enddate.format('MM/DD/YYYY')
        });
    }

    handleClick(level){
        this.setState({level: level});
        console.log(this.state.level);
    }

    handleChangePage(event, newpage){
        console.log(newpage);
        console.log(this.state);
        this.setState( {page: newpage})
    }

    handleRowChange(event) {
        console.log(event.target.value);
        this.setState({rowperpage: event.target.value})
    }

    componentDidUpdate() {
        console.log("component did update");
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
        console.log(event);
        console.log(picker);
        let filterfn = function(d){
            let date = moment(d.date, 'YYYY-MM-DD');
            return picker.startDate.isSameOrBefore(date)
                && picker.endDate.isSameOrAfter(date)
        };
        this.setState({dateRange: picker.startDate.format('MM/DD/YYYY') + ' - ' + picker.endDate.format('MM/DD/YYYY'),
                             displaydata: this.state.masterdata.filter(filterfn)});
        //handle change in barchart
        this.state.chart.updatedata(filterfn);
        //handle change in piechart
        this.state.piechart.updatedata(filterfn);
    }

    handleMenuOpen (event) {
        console.log(event);
        this.setState({anchorEl: event.currentTarget});
    }

    handleMenuClose(sortbylabel) {
        console.log(sortbylabel);
        this.setState({
            anchorEl: null,
            sortByLabel: sortbylabel
        });
        if (sortbylabel === "Min to Max"){
            this.state.chart.sortdata_all((a,b) => {
                return d3.sum(a, a => a.amount) - d3.sum(b, b => b.amount);
            })
        } else {
            this.state.chart.sortdata_all(null);
        }
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
                <DateRangeIcon/>
            </DateRangePicker>
        );
        console.log(this.state);

        return (
                    <div>
                        <div id={"chart"}>
                        </div>
                        <div>
                            <Fade when={this.state.showbutton}>
                                <ButtonGroup className={this.state.showbutton ? null : "nodisplay"}>
                                    <Button onClick={this.handleClick.bind(this,barchartlevels.bytransaction)}>Transaction</Button>
                                    <Button onClick={this.handleClick.bind(this,barchartlevels.daily)}>Daily</Button>
                                    <Button onClick={this.handleClick.bind(this,barchartlevels.weekly)}>Weekly</Button>
                                    <Button onClick={this.handleClick.bind(this,barchartlevels.monthly)}>Monthly</Button>
                                    <Button onClick={this.handleMenuOpen.bind(this)} className="custombutton">
                                        {this.state.sortByLabel}
                                    </Button>
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
                        <div>
                            <MaterialTable
                                columns={[
                                    { title: 'Date', field: 'date',
                                    },
                                    { title: 'Name', field: 'name'},
                                    { title: 'Amount', field: 'amount'},
                                    { title: 'Category', field: 'category'}
                                ]}
                                data={this.state.chart ?
                                      this.state.displaydata.map(function(d){
                                          return {'date': d.date,
                                                  'name': d.name,
                                                  'amount' : d.amount,
                                                  'category' : d.category[0]}
                                      }) : null}
                                options={{actionsColumnIndex: 2}}
                                actions={[{
                                            icon: () => daterange,
                                            isFreeAction: true,
                                            //onClick: function(event){
                                            //    console.log(this.inputElement);
                                            //    this.inputElement.current.focus()
                                            //}.bind(this)
                                    }]}
                                title={"Expenses from " + this.state.dateRange}
                            />
                        </div>

                        {/*
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Category</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {
                                this.state.chart ? this.state.chart.original_data.map(
                                    row => (
                                        <TableRow>
                                            <TableCell>{row.date}</TableCell>
                                            <TableCell>{row.name}</TableCell>
                                            <TableCell>{row.amount}</TableCell>
                                            <TableCell>{row.category[0]}</TableCell>
                                        </TableRow>
                                    )
                                ).slice(
                                    this.state.page * this.state.rowperpage,
                                    this.state.page * this.state.rowperpage + this.state.rowperpage)
                                    : null
                            }
                        </TableBody>
                    </Table>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={this.state.chart ? this.state.chart.withdrawal.length : 0}
                        rowsPerPage={this.state.rowperpage}
                        page={this.state.page}
                        onChangePage={this.handleChangePage.bind(this)}
                        onChangeRowsPerPage={this.handleRowChange.bind(this)}
                    />
                </div>
             */}
                    </div>
        )
    }
}

export default Barchart;