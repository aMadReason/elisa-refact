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
  calcOpticalDensityForWavelength,
  castToNum
} from "../modules/functions";

//import SampleSelect from "./SampleSelect";
import ResultTable from "./ResultTable";
import AssaySvg from "./AssaySvg";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.samples = props.samples;
    this.plates = this.props.plates || Object.keys(props.samples[0].plates);
    this.usedWavelengths = this.props.usedWavelengths || {};
    this.secondaryAntibodies = this.props.secondaryAntibodies || [];
    this.chromagens = props.chromagens || { default: "blue" };

    this.state = {
      primaryEfficiencyFactor: 1.0,
      variancePercent: 0, //4,
      dilutionModifier: 100,
      outputVolumeInMicrolitre: 10000,
      milisecondsBetweenTicks: 150,
      addSecondsPerTick: 20,

      acidApplies: false,
      plate: null,
      phase: null,
      chromgen: null,
      inputVolume: 100,
      inputConcentration: 0,
      timer: null,
      timerOn: false,
      time: 0, // in milseconds
      waitOn: false,
      washOn: false,
      secondaryAntibody: null,
      phases: {
        primaryExposure: [],
        primaryWash: [],
        secondaryExposure: [],
        secondaryWash: [],
        finalExposure: []
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
      primaryEfficiencyFactor,
      inputVolume,
      dilutionModifier,
      inputConcentration,
      outputVolumeInMicrolitre
    } = this.state;

    const result = { ...assay };
    const stockMicrogramPerMillilitre = secondaryAntibody
      ? secondaryAntibody.stockMicrogramPerMillilitre
      : 0;
    const binding = secondaryAntibody ? secondaryAntibody.binding : 0;
    const efficiency = secondaryAntibody ? secondaryAntibody.efficiency : 0;
    const plates = secondaryAntibody ? secondaryAntibody.plates : [];
    const secAntiKey = secondaryAntibody ? secondaryAntibody.key : null;
    const concentration = calcConcentrationFactor(
      inputConcentration,
      stockMicrogramPerMillilitre,
      outputVolumeInMicrolitre
    );
    const dilutionFactor = calcDilutionFactor(inputVolume, dilutionModifier);
    const primaryWashResidue = calcWashResidueFromTimes(phases["primaryWash"]);
    const secondaryWashResidue = calcWashResidueFromTimes(phases["secondaryWash"]);
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
      if (selectedSamples[key] && plate && dilutionFactor && secondaryAntibody && concentration) {
        const sampleResults = selectedSamples[key].results;
        const entry = sampleResults.find(
          i => i.secondaryAntibody === secAntiKey && i.plate === plate
        );
        const value = entry.value / 10;
        //const value = selectedSamples[key].plates[plate] / 10;
        series = calcDilutionSeries(value, dilutionFactor, primaryEfficiencyFactor);
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

        // add wavelengths to data
        this.usedWavelengths.map(key => (data[key] = 0));

        // calc primary
        if (i > 0 && phases["primaryExposure"].length > 0) {
          //data.primary = data.primary * this.state.primaryEfficiencyFactor;
          data.primary = timeModifier(i, sumInt(phases["primaryExposure"]));
          data.primary = washModifierPrimary(data.primary, primaryWashResidue);
        }

        // calc secondary
        if (phases["secondaryExposure"].length > 0) {
          data.secondary = calcBoundAntibody(data.primary, concentration, antibodyEff, binding);
          data.secondary = timeModifier(data.secondary, sumInt(phases["secondaryExposure"]));
          data.secondary = washModifierSecondary(data.secondary, secondaryWashResidue, binding);

          if (this.state.variancePercent && this.state.variancePercent > 0) {
            data.secondary = data.secondary + calcVariance(data.secondary, this.variancePercent);
          }
        }

        if (phases["finalExposure"].length > 0) {
          data.opticalDensity = calcOpticalDensity(data.secondary, sumInt(phases["finalExposure"]));
          data.opacity = calcOpacity(data.opticalDensity);
          Object.keys(this.state.chromagen.wavelengths).map(key => {
            data[key] = calcOpticalDensityForWavelength(
              data.opticalDensity,
              this.state.chromagen.wavelengths[key]
            );
            return null;
          });
        }

        return data;
      });
      return null;
    });

    this.setState({ assay: result });
    return result;
  }

  selectSample(key, identifier) {
    const { selectedSamples } = this.state;
    const sample = this.samples.find(i => i.identifier.toString() === identifier.toString());
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
      timer: setInterval(action, this.state.milisecondsBetweenTicks)
    });
  }

  wait() {
    const { time, phases, phase, addSecondsPerTick } = this.state;
    const stamp = time + addSecondsPerTick * 1000;
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

  handleSelectSample(key, identifier) {
    console.log(identifier);
    const exists = this.samples.find(i => i.identifier === identifier);
    if (!exists) return null;
    const selectedSamples = this.selectSample(key, identifier);
    this.setState({ selectedSamples }, () => this.genAssay());
  }

  handleSelectPlate(plate) {
    this.setState(
      {
        plate
        //phase: "primaryExposure"
      },
      () => this.genAssay()
    );
  }

  handleWait(toPhase = null) {
    const { phase, waitOn } = this.state;
    //if (!phase) return;

    //et newPhase = phase;

    this.setState(
      {
        waitOn: !waitOn,
        phase: toPhase || phase
      },
      () => this.controlTimer()
    );
  }

  handleWash(toPhase = null) {
    const { phase, washOn } = this.state;
    // const hasPrimaryExposure = phases["primaryExposure"].length > 0;
    // const hasPrimaryWash = phases["primaryWash"].length > 0;
    // const hasSecondaryExposure = phases["secondaryExposure"].length > 0;
    // const hasSecondaryWash = phases["secondaryWash"].length > 0;
    // let newPhase = !phase ? "primaryWash" : phase;

    // if (hasPrimaryExposure && !hasPrimaryWash) {
    //   newPhase = "primaryWash";
    // }

    // if (hasSecondaryExposure && !hasSecondaryWash) {
    //   newPhase = "secondaryWash";
    // }

    this.setState(
      {
        washOn: !washOn,
        phase: toPhase || phase
      },
      () => this.controlTimer()
    );
  }

  handleConcentrationInput(value) {
    this.setState({
      //phase: "secondaryExposure",
      inputConcentration: value
    });
  }

  handleSelectSecondaryAntibody(key) {
    this.setState({
      secondaryAntibody: this.secondaryAntibodies.find(i => i.key === key)
    });
  }

  handleAcid() {
    const { phase, phases } = this.state;
    this.setState({
      acidApplied: true,
      timerOn: false,
      timer: clearInterval(this.state.timer),
      time: 0,
      phases: {
        ...phases,
        [phase]: [...phases[phase], 0]
      }
    });
  }

  handleSelectChromagen(key) {
    this.setState({
      chromagen: this.chromagens[key]
      //phase: "finalExposure"
    });
  }

  // Removes invalid characters
  handleNumberBlur(e, key) {
    const target = e.target;
    const value = castToNum(target.value);
    target.value = value;
    this.setState({ [key]: value });
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
      secondaryAntibody,
      chromagen,
      inputVolume,
      dilutionModifier,
      inputConcentration,
      outputVolumeInMicrolitre
    } = this.state;
    const sampleKeys = Object.keys(assay);
    const dilutionFactor = calcDilutionFactor(inputVolume, dilutionModifier);
    const primaryWashResidue = calcWashResidueFromTimes(phases["primaryWash"] || []);
    const secondaryWashResidue = calcWashResidueFromTimes(phases["secondaryWash"] || []);
    let concentration = 0;

    if (secondaryAntibody) {
      concentration = calcConcentrationFactor(
        inputConcentration,
        secondaryAntibody.stockMicrogramPerMillilitre,
        outputVolumeInMicrolitre
      );
    }

    return (
      <div>
        <fieldset>
          <legend>
            Developer Constants <small>Beta version 0.1</small>
          </legend>
          <label>
            Miliseconds between ticks{" "}
            <input
              type="text"
              defaultValue={this.state.milisecondsBetweenTicks}
              onBlur={e => this.handleNumberBlur(e, "milisecondsBetweenTicks")}
              onInput={e => this.setState({ milisecondsBetweenTicks: castToNum(e.target.value) })}
            />
          </label>
          <label>
            Add Seconds at each tick{" "}
            <input
              type="number"
              min="0"
              max="60"
              defaultValue={this.state.addSecondsPerTick}
              onBlur={e => this.handleNumberBlur(e, "addSecondsPerTick")}
              onInput={e => this.setState({ addSecondsPerTick: castToNum(e.target.value) })}
            />
          </label>{" "}
          <label>
            Primary Efficiency Factor{" "}
            <input
              type="number"
              defaultValue={this.state.primaryEfficiencyFactor}
              onBlur={e => this.handleNumberBlur(e, "primaryEfficiencyFactor")}
              onInput={e => this.setState({ primaryEfficiencyFactor: castToNum(e.target.value) })}
            />
          </label>{" "}
          <label>
            Variance (result wobble){" "}
            <input
              type="number"
              defaultValue={this.state.variancePercent}
              onBlur={e => this.handleNumberBlur(e, "primaryEfficiencyFactor")}
              onInput={e => this.setState({ variancePercent: castToNum(e.target.value) })}
            />
            %
          </label>
          <label>
            Dilution Modifier{" "}
            <input
              type="number"
              defaultValue={this.state.dilutionModifier}
              onBlur={e => this.handleNumberBlur(e, "dilutionModifier")}
              onInput={e => this.setState({ dilutionModifier: castToNum(e.target.value) })}
            />
          </label>
          <label>
            Ouput volume in <abbr title="microlitre">μl</abbr>{" "}
            <input
              type="number"
              defaultValue={this.state.outputVolumeInMicrolitre}
              onBlur={e => this.handleNumberBlur(e, "outputVolumeInMicrolitre")}
              onInput={e => this.setState({ outputVolumeInMicrolitre: castToNum(e.target.value) })}
            />
          </label>
          <div>
            <strong>Phase: </strong>
            <em>{phase}</em>
          </div>
        </fieldset>
        <hr />

        <fieldset>
          <legend>Experiment Setup</legend>

          <div>
            <div>
              <label htmlFor="plate">Plate: </label>
              <select id="plate" onChange={e => this.handleSelectPlate(e.target.value)}>
                <option>Select...</option>
                {this.plates.map(i => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>{" "}
              {plate || ""}
            </div>

            <div>
              <label htmlFor="dilution">Volume to transfer in a dilution series </label>
              <input
                id="dilution"
                type="number"
                min="0"
                max="100"
                defaultValue={this.state.inputVolume}
                onBlur={e => this.handleNumberBlur(e, "inputVolume")}
                onInput={e => this.setState({ inputVolume: castToNum(e.target.value) })}
              />{" "}
              {dilutionFactor && <small>Dilution Factor: {dilutionFactor}</small>}
            </div>

            <div>
              <label>
                Secondary Antibody
                <select onChange={e => this.handleSelectSecondaryAntibody(e.target.value)}>
                  <option>select..</option>
                  {this.secondaryAntibodies.map(i => (
                    <option value={i.key} key={i.key}>
                      {i.key}
                    </option>
                  ))}
                </select>
              </label>
              {JSON.stringify(this.state.secondaryAntibody, null, 2)}
              <br />
              <label>
                Secondary antibody concentration
                <input
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={this.state.secondaryInputVolume}
                  onBlur={e => this.handleNumberBlur(e, "secondaryInputVolume")}
                  onInput={e => this.handleConcentrationInput(castToNum(e.target.value))}
                />{" "}
              </label>
              concentration: {concentration}
            </div>

            <div>
              <label>
                Set Chromagen
                <select onChange={e => this.handleSelectChromagen(e.target.value)}>
                  <option>select..</option>
                  {Object.keys(this.chromagens).map(key => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </label>

              <div>{chromagen && JSON.stringify(chromagen.wavelengths, null, 2)}</div>

              <div
                style={{
                  width: "1rem",
                  height: "1rem",
                  backgroundColor: chromagen ? chromagen.color : "transparent"
                }}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Select Patients</legend>

          {sampleKeys.map(i => (
            <div key={i}>
              Select Patient {i.toLocaleUpperCase()}{" "}
              <label htmlFor={i}>
                <input
                  placeholder="Start typing..."
                  list="patients"
                  type="text"
                  id={`row-$i`}
                  onInput={e => this.handleSelectSample(i, e.target.value)}
                  onChange={e => this.handleSelectSample(i, e.target.value)}
                />
              </label>
              {/* <SampleSelect
                sampleKey={i}
                samples={this.samples}
                handleSelectSample={this.handleSelectSample.bind(this)}
              /> */}
            </div>
          ))}

          <datalist id="patients">
            {this.samples.map(i => (
              <option key={`patient-${i.identifier}`} value={i.identifier} />
            ))}
          </datalist>

          {/* {sampleKeys.map(i => (
            <div key={i}>
              Select Patient {i.toLocaleUpperCase()}{" "}
              <SampleSelect
                sampleKey={i}
                samples={this.samples}
                handleSelectSample={this.handleSelectSample.bind(this)}
              />
            </div>
          ))} */}
        </fieldset>

        <hr />

        <fieldset>
          <legend>Primary Exposure & wash</legend>
          <div>
            <button
              disabled={acidApplied || washOn}
              aria-pressed={timerOn && waitOn}
              onClick={({ nativeEvent }) => this.handleWait("primaryExposure")}
            >
              {waitOn ? "Wait Stop" : "Wait Start"}
            </button>

            <button
              disabled={acidApplied || waitOn}
              aria-pressed={timerOn && washOn}
              onClick={({ nativeEvent }) => this.handleWash("primaryWash")}
            >
              {washOn ? "wash Stop" : "wash Start"}
            </button>

            {phase && phase.includes("primary") ? <span>{timeToMins(time)} mins</span> : ""}
          </div>
          <div>
            Primary Exposure:{" "}
            {phases.primaryExposure.filter(i => i).reduce((acc, cur) => acc + timeToMins(cur), 0)}
          </div>
          <div>Number of washes: {0 + phases.primaryWash.filter(i => i).length}</div>
          Primary Wash Residue: {roundPrecision(primaryWashResidue, 3)}
          <ul>
            {phases.primaryWash
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
          <legend>Secondary Exposure & Wash</legend>
          <div>
            <button
              disabled={acidApplied || washOn}
              aria-pressed={timerOn && waitOn}
              onClick={({ nativeEvent }) => this.handleWait("secondaryExposure")}
            >
              {waitOn && phase && phase.includes("secondary") ? "Wait Stop" : "Wait Start"}
            </button>

            <button
              disabled={acidApplied || waitOn}
              aria-pressed={timerOn && washOn}
              onClick={({ nativeEvent }) => this.handleWash("secondaryWash")}
            >
              {washOn && phase && phase.includes("secondary") ? "wash Stop" : "wash Start"}
            </button>

            {phase && phase.includes("secondary") ? <span>{timeToMins(time)} mins</span> : ""}
          </div>
          <div>
            Secondary Exposure:{" "}
            {phases.secondaryExposure.filter(i => i).reduce((acc, cur) => acc + timeToMins(cur), 0)}
          </div>
          <div>Number of washes: {0 + phases.secondaryWash.filter(i => i).length}</div>
          Primary Wash Residue: {roundPrecision(secondaryWashResidue, 3)}
          <ul>
            {phases.secondaryWash
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
          <legend>Chromagen Exposure</legend>
          <div>
            <button
              disabled={acidApplied || washOn}
              aria-pressed={timerOn && waitOn}
              onClick={({ nativeEvent }) => this.handleWait("finalExposure")}
            >
              {waitOn ? "Wait Stop" : "Wait Start"}
            </button>

            {phase && phase.includes("final") ? <span>{timeToMins(time)} mins</span> : ""}

            <button
              style={{ float: "right" }}
              disabled={acidApplied}
              onClick={({ nativeEvent }) => this.handleAcid()}
            >
              Apply Acid
            </button>
          </div>
        </fieldset>

        {/* <hr />

        <fieldset>
          <legend>Select secondary agent (antibody/antigen) & Concentration</legend>
          <label>
            <select onChange={e => this.handleSelectSecondaryAntibody(e.target.value)}>
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
            min="0"
            max="100"
            defaultValue={this.state.secondaryInputVolume}
            onBlur={e => this.handleNumberBlur(e, "secondaryInputVolume")}
            onInput={e => this.handleConcentrationInput(castToNum(e.target.value))}
          />{" "}
          concentration: {concentration}
        </fieldset> */}

        {/* <hr />

        <fieldset>
          <legend>Chromagen</legend>
          <label>
            Set Chromagen
            <select onChange={e => this.handleSelectChromagen(e.target.value)}>
              <option>select..</option>
              {Object.keys(this.chromagens).map(key => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>

          <div>{chromagen && JSON.stringify(chromagen.wavelengths, null, 2)}</div>

          <div
            style={{
              width: "1rem",
              height: "1rem",
              backgroundColor: chromagen ? chromagen.color : "transparent"
            }}
          />
        </fieldset> */}

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
            fillColor={chromagen && chromagen.color}
            acid={this.state.acidApplied}
          />
        </div>

        {this.usedWavelengths.map(key => (
          <ResultTable
            key={key}
            property={key}
            assay={assay}
            title={key}
            selectedSamples={selectedSamples}
          />
        ))}
      </div>
    );
  }
}

export default App;
