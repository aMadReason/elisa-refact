import React from "react";
import ReactDOM from "react-dom";

import { samples, config } from "./data";

import "./css/_reboot.css";
import "./css/_osep.css";
import "./css/styles.css";

import App from "./components/App";

const rootElement = document.getElementById("root");
ReactDOM.render(<App samples={samples} {...config} />, rootElement);
