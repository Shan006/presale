import React, { useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import Highcharts3D from "highcharts/highcharts-3d";

const CircularChat = () => {
  useEffect(() => {
    const chart = Highcharts.chart("container", {
      chart: {
        type: "pie",
        options3d: {
          enabled: true,
          alpha: 45,
          beta: 0,
        },
      },
      title: {
        text: "",
      },
      accessibility: {
        point: {
          valueSuffix: "%",
        },
      },
      plotOptions: {
        pie: {
          innerSize: 100,
          depth: 45,
          dataLabels: {
            enabled: true,
            format: "{point.name} : {point.y}%",
            className: "text-sm lg:text-3xl font-normal",
            style: {
              color: "white",
            },
          },
        },
      },
      colors: ["#7258df", "#5885bf", "#ce89ca", "#75eea3", "#ff33aa"],
      series: [
        {
          name: "Share",
          data: [
            ["Presale", 60],
            ["Liquidity", 15],
            ["Strategic Reserve", 5],
            ["Team", 5],
            ["Reward & Airdrops", 15],
          ],
        },
      ],
    });

    const container = document.getElementById("container");
    if (container) {
      const texts = container.querySelectorAll("text");
      texts[texts.length - 1].style = "display: none";
    }

    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center bg-[#1C1C1C] -mt-[180px] md:-mt-[90px]">
      <div id="container" className="w-full md:h-[500px]"></div>
    </div>
  );
};

export default CircularChat;
