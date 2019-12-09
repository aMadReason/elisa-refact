import React from "react";

import {
  calcDilutionFactor,
  calcDilutionSeries,
  roundPrecision,
  timeModifier,
  calcWashResidueFromTimes,
  timeToMins,
  calcConcentrationFactor,
  sumInt,
  calcBoundAntibody,
  washModifierPrimary,
  washModifierSecondary,
  calcVariance,
  calcOpticalDensity,
  calcOpacity,
  calcOpticalDensityForWavelength
} from "../modules/functions";

import SampleSelect from "./SampleSelect";
import ResultTable from "./ResultTable";
import AssaySvg from "./AssaySvg";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.samples = props.samples;
    this.plates = this.props.plates || Object.keys(props.samples[0].plates);
    this.waveLengths = this.props.waveLengths || {};
    this.secondaryAntibodies = this.props.secondaryAntibodies || {};
    this.chromagens = props.chromagens || { default: "blue" };

    this.state = {
      primaryEfficiencyFactor: 1.0,
      variancePercent: 0, //4,

      acidApplies: false,
      plate: null,
      phase: null,
      chromgen: null,
      inputVolume: 100,
      //dilutionFactor: null,
      inputConcentration: 0,
      timer: null,
      timerOn: false,
      time: 0, // in seconds
      // actualStamp: 0,
      // displayStamp: 0,
      waitOn: false,
      washOn: false,
      secondaryAntibody: null,
      phases: {
        primaryExposure: [],
        primaryWash: [],
        secondaryExposure: [],
        secondaryWash: [],
        chromagenExposure: []
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
    const concentration = calcConcentrationFactor(
      +this.state.inputConcentration,
      microPerMil
    );
    const dilutionFactor = calcDilutionFactor(this.state.inputVolume);
    const primaryWashResidue = calcWashResidueFromTimes(phases["primaryWash"]);
    const secondaryWashResidue = calcWashResidueFromTimes(
      phases["secondaryWash"]
    );
    let antibodyEff = efficiency;

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
        series = calcDilutionSeries(
          value,
          dilutionFactor,
          primaryEfficiencyFactor
        );
      }

      // loop over series
      result[key] = series.map(i => {
        const data = {
          dilution: i,
          primary: 0,
          secondary: 0,
          opticalDensity: 0,
          opacity: 0
        };

        // calc primary
        if (i > 0 && phases["primaryExposure"].length > 0) {
          //data.primary = data.primary * this.state.primaryEfficiencyFactor;
          data.primary = timeModifier(i, sumInt(phases["primaryExposure"]));
          data.primary = washModifierPrimary(data.primary, primaryWashResidue);
        }

        // calc secondary
        if (phases["secondaryExposure"].length > 0) {
          data.secondary = calcBoundAntibody(
            data.primary,
            concentration,
            antibodyEff,
            binding
          );
          data.secondary = timeModifier(
            data.secondary,
            sumInt(phases["secondaryExposure"])
          );
          data.secondary = washModifierSecondary(
            data.secondary,
            secondaryWashResidue,
            binding
          );

          if (this.variancePercent > 0) {
            data.secondary + calcVariance(data.secondary, this.variancePercent);
          }
        }

        if (phases["chromagenExposure"].length > 0) {
          data.opticalDensity = calcOpticalDensity(
            data.secondary,
            sumInt(phases["chromagenExposure"])
          );
          data.opacity = calcOpacity(data.opticalDensity);
          Object.keys(this.waveLengths).map(key => {
            data[key] = calcOpticalDensityForWavelength(
              data.opticalDensity,
              this.waveLengths[key]
            );
            return null;
          });
        }

        return data;

        // return {
        //   dilution,
        //   primary,
        //   secondary,
        //   opticalDensity
        // };
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
    selectedSamples[key] = sample;
    return selectedSamples;
  }

  controlTimer() {
    const { timerOn, phase, phases } = this.state;
    const action = this.wait.bind(this);

    if (timerOn) {
      return this.setState(
        {
          timerOn: false,
          timer: clearInterval(this.state.timer),
          time: 0,
          phases: {
            ...phases,
            [phase]: [...phases[phase], 0]
          }
        },
        () => this.genAssay()
      );
    }

    this.setState({
      timerOn: true,
      timer: setInterval(action, 150)
    });
  }

  wait() {
    const { time, phases, phase } = this.state;
    const stamp = time + 20 * 1000;
    const phaseTimes = [...phases[phase]];

    phaseTimes.pop(); // remove previous counter is already waiting

    this.setState(
      {
        time: stamp,
        phases: {
          ...phases,
          [phase]: [...phaseTimes, time]
        }
      },
      () => this.genAssay()
    );
  }

  handleSelectSample(key, subject) {
    const selectedSamples = this.selectSample(key, subject);
    this.setState({ selectedSamples }, () => this.genAssay());
  }

  handleSelectPlate(plate) {
    this.setState(
      {
        plate,
        phase: "primaryExposure"
      },
      () => this.genAssay()
    );
  }

  handleWait() {
    const { phase, waitOn } = this.state;
    if (!phase) return;
    // const hasPrimaryExposure = phases["primaryExposure"].length > 0;
    // const hasPrimaryWash = phases["primaryWash"].length > 0;
    // const hasSecondaryExposure = phases["secondaryExposure"].length > 0;
    // const hasSecondaryWash = phases["secondaryWash"].length > 0;
    let newPhase = phase;

    // if (hasPrimaryWash && !hasPrimaryExposure) {
    //   newPhase = "primaryExposure";
    // }

    // if (hasPrimaryExposure && hasPrimaryWash && !hasSecondaryWash) {
    //   newPhase = "secondaryExposure";
    // }

    this.setState(
      {
        waitOn: !waitOn,
        phase: newPhase
      },
      () => this.controlTimer()
    );
  }

  handleWash() {
    const { phase, phases, washOn } = this.state;
    const hasPrimaryExposure = phases["primaryExposure"].length > 0;
    const hasPrimaryWash = phases["primaryWash"].length > 0;
    const hasSecondaryExposure = phases["secondaryExposure"].length > 0;
    const hasSecondaryWash = phases["secondaryWash"].length > 0;
    let newPhase = !phase ? "primaryWash" : phase;

    if (hasPrimaryExposure && !hasPrimaryWash) {
      newPhase = "primaryWash";
    }

    if (hasSecondaryExposure && !hasSecondaryWash) {
      newPhase = "secondaryWash";
    }

    this.setState(
      {
        washOn: !washOn,
        phase: newPhase
      },
      () => this.controlTimer()
    );
  }

  handleConcentrationInput(value) {
    this.setState({
      phase: "secondaryExposure",
      inputConcentration: value
    });
  }

  handleSelectSecondaryAntibody(key) {
    this.setState({
      secondaryAntibody: this.secondaryAntibodies[key]
    });
  }

  handleSelectChromagen(color) {
    this.setState({
      chromagen: color,
      phase: "chromagenExposure"
    });
  }

  render() {
    const {
      acidApplied,
      assay,
      timerOn,
      waitOn,
      washOn,
      time,
      plate,
      phases,
      selectedSamples,
      phase,
      secondaryAntibody
    } = this.state;
    const sampleKeys = Object.keys(assay);
    const dilutionFactor = calcDilutionFactor(this.state.inputVolume);
    const primaryWashResidue = calcWashResidueFromTimes(
      phases["primaryWash"] || []
    );

    const concentration = !secondaryAntibody
      ? 0
      : calcConcentrationFactor(
          +this.state.inputConcentration,
          secondaryAntibody.microPerMil
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
              defaultValue={this.state.variancePercent}
              onInput={e => this.setState({ variancePercent: e.target.value })}
            />
            %
          </label>
          <div>
            <strong>Phase: </strong>
            <em>{phase}</em>
          </div>
        </fieldset>
        <hr />

        <div>
          <button
            disabled={acidApplied || washOn}
            aria-pressed={timerOn && waitOn}
            onClick={({ nativeEvent }) => this.handleWait()}
          >
            {waitOn ? "Wait Stop" : "Wait Start"}
          </button>

          <button
            disabled={acidApplied || waitOn}
            aria-pressed={timerOn && washOn}
            onClick={({ nativeEvent }) => this.handleWash()}
          >
            {washOn ? "wash Stop" : "wash Start"}
          </button>

          <span>{timeToMins(time)} mins</span>
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
            onInput={e => this.setState({ inputVolume: e.target.value })}
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
                    Wash {idx + 1} {timeToMins(i)}
                  </li>
                ))}
          </ul>
        </fieldset>

        <hr />

        <fieldset>
          <legend>Step 4</legend>
          <label>
            <select
              onChange={e => this.handleSelectSecondaryAntibody(e.target.value)}
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
            onInput={e => this.handleConcentrationInput(e.target.value)}
          />{" "}
          concentration: {concentration}
        </fieldset>

        <hr />

        <fieldset>
          <legend>Step 5</legend>
          <label>
            Set Chromagen
            <select onChange={e => this.handleSelectChromagen(e.target.value)}>
              <option>select..</option>
              {Object.keys(this.chromagens).map(key => (
                <option value={this.chromagens[key]}>{key}</option>
              ))}
            </select>
          </label>

          <div
            style={{
              width: "1rem",
              height: "1rem",
              backgroundColor: this.state.chromagen
            }}
          />
        </fieldset>

        <hr />

        <div style={{ maxWidth: "100%" }}>
          <ResultTable
            property="dilution"
            assay={assay}
            title="Dilutions"
            selectedSamples={selectedSamples}
          />

          <ResultTable
            property="primary"
            assay={assay}
            title="Primary Exposure"
            selectedSamples={selectedSamples}
          />

          <ResultTable
            property="secondary"
            assay={assay}
            title="Secondary Exposure"
            selectedSamples={selectedSamples}
          />
          <ResultTable
            property="opticalDensity"
            assay={assay}
            title="Optical Density"
            selectedSamples={selectedSamples}
          />
          <ResultTable
            property="opacity"
            assay={assay}
            title="Opacity"
            selectedSamples={selectedSamples}
          />
        </div>

        <div style={{ maxWidth: "500px" }}>
          <AssaySvg
            assay={assay}
            fillColor={this.state.chromagen}
            acid={false}
          />
        </div>
      </div>
    );
  }
}

export default App;
