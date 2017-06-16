module.exports = {
    "extends": "airbnb-base",
    "plugins": [
        "import"
    ],
    "rules": {
        "indent": [ "error", 4 ],
        "no-console": "off",
        "max-len": [ "error", { code: 120 } ],
        "import/prefer-default-export": "off"
    },
    "globals": {
        "window": true
    }
};
