import React from "react";

import {
  calculateDilutionFactor,
  calculateDilutionSeries,
  roundPrecision,
  timeModifier,
  calclateWashResidueFromTimestamps,
  timestampToMins,
  calculateConcentrationFactor,
  sumInt,
  calculateBoundAntibody,
  washModifier
  // calculateVariance
} from "../modules/functions";

import SampleSelect from "./SampleSelect";
import ResultTable from "./ResultTable";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.samples = props.samples;
    this.plates = this.props.plates || Object.keys(props.samples[0].plates);
    this.waveLengths = this.props.waveLengths || {};
    this.secondaryAntibodies = this.props.secondaryAntibodies || {};

    this.state = {
      primaryEfficiencyFactor: 1.0,
      variancePercent: 4,

      plate: null,
      phase: "primaryExposure",
      inputVolume: 100,
      dilutionFactor: null,
      inputConcentration: 0,
      timer: null,
      timerOn: false,
      actualStamp: 0,
      displayStamp: 0,
      waitOn: false,
      washOn: false,
      secondaryAntibody: null,
      phases: {
        primaryExposure: [],
        primaryWash: [],
        secondaryExposure: []
      },
      selectedSamples: {
        a: null,
        b: null,
        c: null,
        d: null,
        e: null,
        f: null,
        g: null,
        h: null
      },
      assay: {
        a: [],
        b: [],
        c: [],
        d: [],
        e: [],
        f: [],
        g: [],
        h: []
      }
    };
  }

  componentDidMount() {
    const assay = this.genAssay();
    this.setState({ assay });
  }

  genAssay() {
    const {
      assay,
      plate,
      phase,
      phases,
      secondaryAntibody,
      selectedSamples,
      primaryEfficiencyFactor
    } = this.state;

    const result = { ...assay };
    const microPerMil = secondaryAntibody ? secondaryAntibody.microPerMil : 0;
    const binding = secondaryAntibody ? secondaryAntibody.binding : 0;
    const efficiency = secondaryAntibody ? secondaryAntibody.efficiency : 0;
    const plates = secondaryAntibody ? secondaryAntibody.plates : [];
    const concentration = calculateConcentrationFactor(
      +this.state.inputConcentration,
      microPerMil
    );
    const dilutionFactor = calculateDilutionFactor(this.state.inputVolume);
    const primaryWashResidue = calclateWashResidueFromTimestamps(
      phases["primaryWash"] || []
    );
    let antibodyEff = 0;

    if (secondaryAntibody) {
      // if secondary antibody has specific plates defined
      // set to zero if plate in state is invalid
      if (secondaryAntibody && plates && plates.length > 0) {
        antibodyEff = plates.includes(plate) ? efficiency : 0;
      }
    }

    // calc dilutions
    Object.keys(selectedSamples).map(key => {
      let series = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      if (selectedSamples[key] && plate && dilutionFactor) {
        const value = selectedSamples[key].plates[plate] / 10;
        series = calculateDilutionSeries(
          value,
          dilutionFactor,
          primaryEfficiencyFactor
        );
      }

      // loop over series
      result[key] = series.map(i => {
        const dilution = i;
        const primary = timeModifier(i, sumInt(phases["primaryExposure"]));
        let secondary = 0;

        if (!secondaryAntibody && phase !== "secondaryExposure") {
          return { dilution, primary, secondary: 0 };
        }

        secondary = calculateBoundAntibody(
          primary,
          concentration,
          antibodyEff,
          binding
        );
        secondary = timeModifier(secondary, phases["secondaryExposure"]);
        secondary = washModifier(secondary, primaryWashResidue, binding);
        //   secondary + calculateVariance(secondary, this.variancePercent);

        return {
          dilution,
          primary,
          secondary
        };
      });
      return null;
    });

    this.setState({ assay: result });

    return result;
  }

  selectSample(key, subject) {
    const { selectedSamples } = this.state;
    const sample = this.samples.find(
      i => i.subject.toString() === subject.toString()
    );
    return { ...selectedSamples, [key]: sample };
  }

  controlTimer() {
    const { timerOn, actualStamp, phase, phases } = this.state;
    const start = +new Date();
    const action = this.wait.bind(this);

    if (timerOn) {
      return this.setState(
        {
          timerOn: false,
          timer: clearInterval(this.state.timer),
          displayStamp: null,
          phases: {
            ...phases,
            [phase]: [...phases[phase], actualStamp]
          }
        },
        () => this.genAssay()
      );
    }

    this.setState({
      start,
      timerOn: true,
      timer: setInterval(action, 150)
    });
  }

  wait() {
    const { actualStamp, displayStamp } = this.state;
    const stamp = actualStamp + 20 * 1000;
    const display = displayStamp + 20 * 1000;
    this.setState({
      actualStamp: stamp,
      displayStamp: display
    });
  }

  handleSelectSample(key, subject) {
    this.setState({ selectedSamples: this.selectSample(key, subject) }, () =>
      this.genAssay()
    );
  }

  handleSelectPlate(plate) {
    this.setState({ plate }, () => this.genAssay());
  }

  handleWait() {
    const { phase, phases } = this.state;
    const hasPrimaryExposure = phases["primaryExposure"].length > 0;
    const hasPrimaryWash = phases["primaryWash"].length > 0;
    //const hasSecondaryExposure = phases['secondaryExposure'].length > 0;
    let newPhase = phase;

    if (hasPrimaryExposure && hasPrimaryWash) {
      newPhase = "secondaryExposure";
    }

    if (phase !== newPhase) {
      this.setState(
        {
          phase: newPhase
        },
        () => this.controlTimer()
      );
    }
  }

  handleWash() {
    const { phase, phases } = this.state;
    const hasPrimaryWash = phases["primaryWash"].length > 0;
    let newPhase = phase;

    if (!hasPrimaryWash) {
      newPhase = "primaryWash";
    }

    if (phase !== newPhase) {
      this.setState(
        {
          phase: newPhase
        },
        () => this.controlTimer()
      );
    }
  }

  render() {
    const {
      timerOn,
      waitOn,
      washOn,
      displayStamp,
      plate,
      phases,
      dilutionFactor,
      selectedSamples
    } = this.state;
    const sampleKeys = Object.keys(this.samples);
    const primaryWashResidue = calclateWashResidueFromTimestamps(
      phases["primaryWash"] || []
    );

    return (
      <div>
        <fieldset>
          <legend>Developer Constants</legend>
          <label>
            Primary Efficiency Factor{" "}
            <input
              type="text"
              defaultValue={this.state.primaryEfficiencyFactor}
              onInput={e =>
                this.setState({ primaryEfficiencyFactor: e.target.value })
              }
            />
          </label>{" "}
          <label>
            Variance (result wobble){" "}
            <input
              type="text"
              defaultValue={this.state.primaryEfficiencyFactor}
              onInput={e => this.setState({ variancePercent: e.target.value })}
            />
            %
          </label>
        </fieldset>
        <hr />

        <div>
          <button
            // disabled={acidApplied}
            aria-pressed={timerOn && waitOn}
            onClick={({ nativeEvent }) => this.handleWash()}
          >
            {waitOn ? "Wait Stop" : "Wait Start"}
          </button>

          <button
            // disabled={acidApplied}
            aria-pressed={timerOn && washOn}
            onClick={({ nativeEvent }) => this.handleExposureOverTime("wash")}
          >
            {washOn ? "Wash Stop" : "Wash Start"}
          </button>

          <span>{timestampToMins(displayStamp)} mins</span>
        </div>

        <hr />
        <fieldset>
          <legend>Step 3.1: Select Plate</legend>
          <select onChange={e => this.handleSelectPlate(e.target.value)}>
            <option>Select...</option>
            {this.plates.map(i => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>{" "}
          {plate || ""}
        </fieldset>

        <hr />

        <fieldset>
          <legend>Step 2: Dilution</legend>
          Volume to transfer in a dilution series{" "}
          <input
            type="number"
            defaultValue={this.state.inputVolume}
            onInput={e => this.handleDilutionVolume(e)}
          />{" "}
          {dilutionFactor && <small>Dilution Factor: {dilutionFactor}</small>}
        </fieldset>

        <hr />

        <fieldset>
          <legend>Step 1: Select Patients</legend>
          {sampleKeys.map(i => (
            <div key={i}>
              Select Patient {i.toLocaleUpperCase()}{" "}
              <SampleSelect
                sampleKey={i}
                samples={this.samples}
                handleSelectSample={this.handleSelectSample.bind(this)}
              />
            </div>
          ))}
        </fieldset>

        <hr />

        <fieldset>
          <legend>Step 3.2: Primary Antibody Exposure & wash</legend>
          <div>
            Number of washes:{" "}
            {Array.isArray(phases.primaryWash)
              ? phases.primaryWash.filter(i => i).length
              : 0}
          </div>
          Primary Wash Residue: {roundPrecision(primaryWashResidue, 3)}
          <ul>
            {Array.isArray(phases.primaryWash) &&
              phases.primaryWash
                .filter(i => i)
                .map((i, idx) => (
                  <li key={idx}>
                    Wash {idx + 1} {timestampToMins(i)}
                  </li>
                ))}
          </ul>
        </fieldset>

        <hr />

        <fieldset>
          <legend>Step 4</legend>
          <label>
            <select
              onChange={e => this.handleSelectSecondaryAB(e.target.value)}
            >
              <option>select..</option>
              {Object.keys(this.secondaryAntibodies).map(k => (
                <option value={k} key={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          {JSON.stringify(this.state.secondaryAntibody, null, 2)}
          <br />
          <input
            type="number"
            defaultValue={this.state.secondaryInputVolume}
            onInput={e => this.handleABConcentration(e)}
          />{" "}
          concentration: {this.state.secondaryConcentration}
        </fieldset>

        <hr />

        <div style={{ maxWidth: "100%" }}>
          <ResultTable
            property="dilution"
            assay={this.state.assay}
            title="Dilutions"
            selectedSamples={selectedSamples}
          />

          <ResultTable
            property="primary"
            assay={this.state.assay}
            title="Primary Exposure"
            selectedSamples={selectedSamples}
          />

          <ResultTable
            property="secondary"
            assay={this.state.assay}
            title="Secondary Exposure"
            selectedSamples={selectedSamples}
          />
        </div>
      </div>
    );
  }
}

export default App;
