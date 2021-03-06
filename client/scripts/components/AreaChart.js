import React from 'react';
import { VictoryChart, VictoryVoronoiContainer, VictoryArea, VictoryAxis, VictoryTooltip, VictoryLabel} from 'victory';
import {getReadableFileSizeString} from '../helpers';

var AreaChart = React.createClass({

  render : function() {
    // this.props.areainput is a field name that can be changed by the user
    // pull the right summary data from activeSummaryData
    var activeField = this.props.areainput;
    var activeFieldData = this.props.activeSummaryData[activeField];

    // remove nulls / boring values
    var activeFieldDataValidKeys = Object.keys(activeFieldData).filter(
      function(value, index) {
        if (value == "no data" || value == "other categories") {
          return false; // skip
        } else {
          return true;
        }
      }
    );
    /*
    var activeFieldSorted = activeFieldDataValidKeys.sort(function(a, b) {
      if (a.includes("^")) {
        var match_a = a.match(/\d+/g); //find all the integers, for 10^2-10^3 will return [10,2,10,3]
        var match_b = b.match(/\d+/g);
        return (Math.pow(match_a[0],match_a[1]) - Math.pow(match_b[0],match_b[1]));
      }
      else {
        return (parseInt(a) - parseInt(b))}
      });
      */
    var activeFieldSorted = activeFieldDataValidKeys.sort()
    // Format data the way VictoryChart / VictoryArea wants it
    var chartData = activeFieldSorted.map(
      function(value,index) {
        var count = activeFieldData[value];
        if (activeField=="download_size_summary") {
          var match = value.match(/\d+/g);
          var first = getReadableFileSizeString(Math.pow(match[0],match[1]));
          var second = getReadableFileSizeString(Math.pow(match[2],match[3]));
          var newfield = first + " - " + second;
        }
        else {
          var newfield = value;
        }
        //define tooltip label
        var low = value.split("-")[0];
        var high = value.split("-")[1];
        if (low.startsWith(">")) {
          var num = low.split("> ")[1];
          var power = Math.floor(Math.log10(num));
          if(power>3) {
            if (String(num).substr(0,2)=="10") {
              var low = ">1e"+String(power);
            } else {
              var low = ">"+num[0]+"e"+String(power);
            }
          }
          var tooltip = low;
        } else {
          var highPower = Math.floor(Math.log10(high));
          var lowPower = Math.floor(Math.log10(low));
          if (highPower>=4) {
            if (high.substr(0,2)=="10") {
              var high = "1e"+String(highPower);
            } else {
              var high = high[0]+"e"+String(highPower);
            }
            if (lowPower>3) {
              if (low.substr(0,2)=="10") {
                var low = "1e"+String(lowPower);
              } else {
                var low = low[0]+"e"+String(lowPower);
              }
            }
          }
          var tooltip = low + " - " + high;
        }

        return {"x":Number(index+0.5),"count":count,"label":newfield + " : " + count, "tooltip":tooltip};
      }
    );

    var chartLabels = chartData.map(function(value, index) {
        var low = value.label.split(" :")[0].split("-")[0];
        var high = value.label.split(" :")[0].split("-")[1];
        if (low.startsWith(">")) {
          if (Math.floor(Math.log10(parseFloat(low.split("> ")[1])))>3) {
            var power = Math.floor(Math.log10(parseFloat(low.split("> ")[1])));
            var num = low.split("> ")[1];
            if (String(num).substr(0,2)=="10") {
              var low = ">1e"+String(power);
            } else {
              var low = ">"+num[0]+"e"+String(power);
            }
          }
          return low;
        } else {
          if (Math.floor(Math.log10(high))>3) {
            if (high.substr(0,2)=="10") {
              var high = "1e"+String(Math.floor(Math.log10(high)));
            } else {
              var high = high[0]+"e"+String(Math.floor(Math.log10(high)));
            }
          }
          return high;
        }
      }
    );
    //var flatChartLabels = [].concat(...chartLabels);

    var areawidth = 530;

    return(
      <div className="area-container">
        <VictoryChart
          theme={this.props.colortheme}
          width={areawidth}
          height={320}
          padding={{top: 10, right: 25, left: 55, bottom: 35}}
          containerComponent={
            <VictoryVoronoiContainer
              dimension="x"
              labels={(chartData) => chartData.tooltip}
              style={{overflow:"visible", padding: "0 10px"}}
              labelComponent={
                <VictoryTooltip
                  flyoutStyle={{fill: "white"}}
                />}
          />}
        >
          <VictoryAxis
            tickValues={chartLabels}
            fixLabelOverlap={true}
            style={{ticks: {stroke: "#757575", size: 10}, tickLabels:{fill:"#757575", fontSize:12, fontWeight: 600} }}
            tickLabelComponent={
              <VictoryLabel dy={-5} />
            }
          />
          <VictoryAxis
            dependentAxis
            style={{
              tickLabels: { fill: "#757575",fontSize: 12, fontWeight: 600}
            }}
          />

          <VictoryArea
            data={chartData}
            x="x"
            y="count"
            style={{
              data: { fillOpacity: 0.5, strokeWidth: 2 },
              labels: { fill: "#333",fontSize: 12 }
            }}
          />
        </VictoryChart>
      </div>
    )}
  });

export default AreaChart;
