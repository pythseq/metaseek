import React from 'react';
import axios from 'axios';
import apiConfig from '../config/api.js';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import ColorPalette from './ColorPalette';
import Paper from 'material-ui/Paper';
import {Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';

// My component imports
import Header from './Header';
import VizDashboard from './VizDashboard';
import Loading from './Loading';
import {getReadableFileSizeString} from '../helpers';

var apiRequest = axios.create({
  baseURL: apiConfig.baseURL
});

var DiscoveryDetail = React.createClass({
  getInitialState: function() {
    return {
      'discovery':{},
      'summaryData': [],
      'loaded': false,
      'dataTable': []
    }
  },
  componentWillMount: function() {
    var self = this;
    apiRequest.get('/discovery/' + this.props.params.id)
    .then(function (response) {
      self.setState({"discovery": response.data.discovery});
      apiRequest.post("/datasets/search/summary", {
        "filter_params":response.data.discovery.filter_params
      }).then(function (response) {
        self.setState({"summaryData": response.data.summary, "loaded":true})
      });

    });
  },
  render: function() {
    if (!this.state.loaded) return <Loading/>;
    var tableHeaderStyles = {color:'#fff',fontFamily:'Roboto',fontSize:'14px',fontWeight:700};

    const ruletypes = JSON.parse("{\"0\":\"=\", \"1\":\"<\", \"2\":\">\", \"3\":\"<=\", \"4\":\">=\", \"5\":\"=\", \"6\":\"!=\", \"7\":\"contains one of\", \"10\":\"is not none\"}");
    console.log(ruletypes);
    return (
      <div>
        <Header history={this.props.history}/>
          <MuiThemeProvider muiTheme={getMuiTheme(ColorPalette)}>
            <div className="explore-container">
              <Paper className="discovery-header card three" >
                <h2>{this.state.discovery.discovery_title}</h2>
                <h3>Discovery Details</h3>

                <span className="filterparam-table-title">Filter Parameters</span>
                  <div className="discovery-header-summary">
                    <span className="discovery-header-first"><span className="active">{this.state.summaryData.total_datasets} datasets</span></span>
                    <span className="discovery-header-second"> {getReadableFileSizeString(this.state.summaryData.total_download_size)} <span className="overview-title">Estimated Total Download Size</span></span>
                    <span className="discovery-header-user">{"saved by metaseek user "+this.state.discovery.owner.uri.substr(-1)+" on "+this.state.discovery.timestamp.substr(0,16)}</span>
                  </div>

                <div className="discovery-filterparam-table-container">
                  <Table className="filterparam-table" bodyStyle={{overflowX: 'scroll'}} fixedHeader={false} fixedFooter={false} selectable={false} style={{'tableLayout':'auto', 'overflow':'visible'}}>
                    <TableHeader style={{backgroundColor:'#7075E0'}} adjustForCheckbox={false} displaySelectAll={false} enableSelectAll={false}>
                      <TableRow selectable={false}>
                        <TableHeaderColumn style={tableHeaderStyles}>Field</TableHeaderColumn>
                        <TableHeaderColumn style={tableHeaderStyles}></TableHeaderColumn>
                        <TableHeaderColumn style={tableHeaderStyles}>Value</TableHeaderColumn>
                      </TableRow>
                    </TableHeader>
                    <TableBody showRowHover={false} stripedRows={false} displayRowCheckbox={false} preScanRows={false}>
                      {JSON.parse(this.state.discovery.filter_params)["rules"].map( (rule, index) => (
                        <TableRow selectable={false} key={index}>
                          <TableRowColumn>{rule.field}</TableRowColumn>
                          <TableRowColumn>{ruletypes[JSON.stringify(rule.type)]}</TableRowColumn>
                          <TableRowColumn>{JSON.stringify(rule.value)}</TableRowColumn>
                        </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </Paper>
              <VizDashboard activeSummaryData={this.state.summaryData}/>
            </div>
          </MuiThemeProvider>
      </div>

    )
  }
});

export default DiscoveryDetail;
