module.exports = {
    "extends": "airbnb-base",
    "plugins": [
        "import"
    ],
    "rules": {
        "indent": [ "error", 4 ],
        "no-console": "off",
        "max-len": [ "error", { code: 120 } ],
        "import/prefer-default-export": "off",
        "import/extensions": "off",
        "no-template-curly-in-string": "off"
    },
    "globals": {
        "window": true
    }
};
