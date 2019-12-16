import React from "react";

function SampleSelect(props) {
  return (
    <select onChange={e => props.handleSelectSample(props.sampleKey, e.target.value)}>
      <option>Select...</option>
      {props.samples.map(i => (
        <option key={i.identifier} value={i.identifier}>
          {i.identifier}
        </option>
      ))}
    </select>
  );
}

export default SampleSelect;
