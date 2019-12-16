import React from "react";

import { roundPrecision } from "../modules/functions";

function ResultTable(props) {
  const { assay, title, property, selectedSamples } = props;

  if (!assay) return null;
  const keys = Object.keys(assay);

  return (
    <table>
      {title && (
        <thead>
          <tr>
            <th colSpan={assay[keys[0]].length}>{title}</th>
          </tr>
          <tr>
            <th>Sample</th>
            {assay[keys[0]].map((i, idx) => (
              <th key={"head-" + idx}>{idx + 1}</th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {keys.map(k => (
          <tr key={k}>
            {/* <td>{selectedSamples[k].subject}</td> */}
            <th>{selectedSamples[k] && selectedSamples[k].identifier}</th>
            {assay[k].map((cell, idx) => (
              <td key={k + "-" + idx}>{roundPrecision(cell[property], 3)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ResultTable;
