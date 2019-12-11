export const config = {
  plates: ["IgM RFs", "IgG RFs", "anti-CCP", "ANA", "dsDNA", "Sm", "RNP"],
  secondaryAntibodies: {
    "test-a": {
      efficiency: 1,
      binding: 0.04,
      stockMicrogramPerMillilitre: 500
    },
    "test-b": {
      plates: ["RNP"],
      efficiency: 1.9,
      binding: 0.08,
      stockMicrogramPerMillilitre: 500,
      microPerMil: 500
    }
  },
  usedWavelengths: ["450nm", "520nm", "544nm", "590nm", "645nm"],
  chromagens: {
    "chromagen-1": {
      color: "blue",
      wavelengths: {
        "450nm": 1.0,
        "520nm": 0.4,
        "544nm": 0.2,
        "590nm": 0.14,
        "645nm": 0.11
      }
    },
    "chromagen-2": {
      color: "red",
      wavelengths: {
        "450nm": 0.11,
        "520nm": 0.14,
        "544nm": 0.2,
        "590nm": 0.1,
        "645nm": 1.0
      }
    }
  }
};

export const samples = [
  {
    subject: "dummy",
    plates: {
      "IgM RFs": 152,
      "IgG RFs": 4,
      "IgA RFs": 2,
      "anti-CCP": 15,
      ANA: 2,
      dsDNA: 0,
      Sm: 0,
      RNP: 0
    }
  },
  {
    subject: "201",
    plates: {
      "IgM RFs": 4,
      "IgG RFs": 4,
      "IgA RFs": 2,
      "anti-CCP": 15,
      ANA: 2,
      dsDNA: 0,
      Sm: 0,
      RNP: 0
    }
  },
  {
    subject: "202",
    plates: {
      "IgM RFs": 80,
      "IgG RFs": 120,
      "IgA RFs": 4,
      "anti-CCP": 80,
      ANA: 0,
      dsDNA: 0,
      Sm: 0,
      RNP: 1
    }
  },
  {
    subject: "203",
    plates: {
      "IgM RFs": 80,
      "IgG RFs": 160,
      "IgA RFs": 10,
      "anti-CCP": 40,
      ANA: 8,
      dsDNA: 8,
      Sm: 0,
      RNP: 12
    }
  },
  {
    subject: "204",
    plates: {
      "IgM RFs": 40,
      "IgG RFs": 40,
      "IgA RFs": 10,
      "anti-CCP": 30,
      ANA: 3,
      dsDNA: 7,
      Sm: 0,
      RNP: 12
    }
  },
  {
    subject: "205",
    plates: {
      "IgM RFs": 20,
      "IgG RFs": 20,
      "IgA RFs": 6,
      "anti-CCP": 15,
      ANA: 4,
      dsDNA: 0,
      Sm: 0,
      RNP: 0
    }
  },
  {
    subject: "206",
    plates: {
      "IgM RFs": 40,
      "IgG RFs": 10,
      "IgA RFs": 8,
      "anti-CCP": 40,
      ANA: 2,
      dsDNA: 2,
      Sm: 0,
      RNP: 0
    }
  },
  {
    subject: "207",
    plates: {
      "IgM RFs": 160,
      "IgG RFs": 320,
      "IgA RFs": 160,
      "anti-CCP": 80,
      ANA: 40,
      dsDNA: 15,
      Sm: 4,
      RNP: 10
    }
  },
  {
    subject: "208",
    plates: {
      "IgM RFs": 80,
      "IgG RFs": 40,
      "IgA RFs": 12,
      "anti-CCP": 80,
      ANA: 0,
      dsDNA: 0,
      Sm: 0,
      RNP: 0
    }
  }
  // {
  //   subject: "00a",
  //   condition: ["RA"],
  //   gender: "f",
  //   code: "v3002",
  //   plates: {
  //     dummy: 15.2,
  //     "IgM RFs": 15.2,
  //     "IgG RFs": 1,
  //     "IgA RFs": 2,
  //     "anti-CCP": 15,
  //     ANA: 2,
  //     dsDNA: 0,
  //     Sm: 0,
  //     RNP: 0
  //   }
  // },
  // {
  //   subject: "001",
  //   condition: ["RA"],
  //   gender: "f",
  //   code: "v3002",
  //   plates: {
  //     dummy: 15.6,
  //     "IgM RFs": 70,
  //     "IgG RFs": 1,
  //     "IgA RFs": 2,
  //     "anti-CCP": 15,
  //     ANA: 2,
  //     dsDNA: 0,
  //     Sm: 0,
  //     RNP: 0
  //   }
  // },
  // {
  //   subject: 201,
  //   condition: ["RA"],
  //   gender: "f",
  //   code: "v3002",
  //   plates: {
  //     dummy: 50,
  //     "IgM RFs": 4,
  //     "IgG RFs": 4,
  //     "IgA RFs": 2,
  //     "anti-CCP": 15,
  //     ANA: 2,
  //     dsDNA: 0,
  //     Sm: 0,
  //     RNP: 0
  //   }
  // },
  // {
  //   subject: 202,
  //   condition: ["RA"],
  //   gender: "f",
  //   code: "n1002",
  //   plates: {
  //     dummy: 0.42,
  //     "IgM RFs": 80,
  //     "IgG RFs": 120,
  //     "IgA RFs": 4,
  //     "anti-CCP": 80,
  //     ANA: 0,
  //     dsDNA: 0,
  //     Sm: 0,
  //     RNP: 1
  //   }
  // },
  // {
  //   subject: 203,
  //   condition: ["RA"],
  //   gender: "m",
  //   code: "P1004",
  //   plates: {
  //     dummy: 6.1,
  //     "IgM RFs": 80,
  //     "IgG RFs": 160,
  //     "IgA RFs": 10,
  //     "anti-CCP": 40,
  //     ANA: 8,
  //     dsDNA: 8,
  //     Sm: 0,
  //     RNP: 12
  //   }
  // },
  // {
  //   subject: "bob",
  //   condition: ["RA"],
  //   gender: "m",
  //   code: "P1004",
  //   plates: {
  //     dummy: 0.17,
  //     "IgM RFs": 80,
  //     "IgG RFs": 160,
  //     "IgA RFs": 10,
  //     "anti-CCP": 40,
  //     ANA: 8,
  //     dsDNA: 8,
  //     Sm: 0,
  //     RNP: 12
  //   }
  // },
  // {
  //   subject: "sue",
  //   condition: ["RA"],
  //   gender: "f",
  //   code: "P1004",
  //   plates: {
  //     dummy: 0.34,
  //     "IgM RFs": 80,
  //     "IgG RFs": 160,
  //     "IgA RFs": 10,
  //     "anti-CCP": 40,
  //     ANA: 8,
  //     dsDNA: 8,
  //     Sm: 0,
  //     RNP: 12
  //   }
  // },
  // {
  //   subject: "lisa",
  //   condition: ["RA"],
  //   gender: "f",
  //   code: "P1004",
  //   plates: {
  //     dummy: 70,
  //     "IgM RFs": 80,
  //     "IgG RFs": 160,
  //     "IgA RFs": 10,
  //     "anti-CCP": 40,
  //     ANA: 8,
  //     dsDNA: 8,
  //     Sm: 0,
  //     RNP: 12
  //   }
  // }
];
