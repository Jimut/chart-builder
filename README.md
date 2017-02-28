Chart builder using FusionCharts
===============================
It is a chart builder useful for creating charts by simply dragging dimensions and measures to selection boxes. Data is taken from a json file with simple syntax.

Installation
------------
1. Clone the repo on a local machine
2. Run `npm install`
3. Run `npm run dev`

Or if you want to make and run the distribution copy run `npm run prod`

Data format
-----------
The main object contains the different dimensions.
```
{
    "Brand": { ... },
    "Category": { ... },
    "Technology": { ... }
}
```
Each dimensions contains their own values called dimension-values
```
{
    "Brand": {
        "LG": { ... },
        "Samsung": { ... }
    },
    "Technology": {
        "WiFi": { ... },
        "NFC": { ... }
    }
}
```
And each dimension-values must contain their own attributes as key value pair.
```
{
    "Brand": {
        "LG": {
            "Price": 5000,
            "Sales": 40000
        },
        "Samsung": {
            "Price": 7000,
            "Sales": 20000
        }
    },
    "Technology": {
        "NFC": {
            "Price": 2000,
            "Sales": 4000
        }
    }
}
```
N.B.: All the keys of the dimension-values attributes must be the same, to display the proper result.

Data input
----------
Data is taken by default from `app\data\data.json` file. The file path can be changed from `app\scripts\main.js` by changing the value of the argument where the ChartBuilder object is constructed.
```javascript
window.chartBuilder = new ChartBuilder('/data/data.json');
```
