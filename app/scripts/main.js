const FusionChats = require('fusioncharts');
require("fusioncharts/fusioncharts.charts")(FusionCharts);
const Dragula = require('dragula');

var ChartBuilder = function () {
    this.chartElm = document.getElementById('chart');
    this.dimensionsElm = document.getElementById('dimensions');
    this.selectedDimensionsElm = document.getElementById('selectedDimensions');
    this.measuresElm = document.getElementById('measures');
    this.selectedMeasuresElm = document.getElementById('selectedMeasures');
    this.typeSelectorElm = document.getElementById('typeSelector');
    this.dataUrl = "/data/data.json";

    this.dimensions = [];
    this.selectedDimensions = [];
    this.measures = [];
    this.selectedMeasures = [];

    this.initChart();
    this.attachDragHandler();
    this.parseData();

    this.typeSelectorElm.addEventListener('change', this.typeSelectHandler.bind(this));
};

ChartBuilder.prototype.typeSelectHandler = function (evt) {
    this.chartConstruct();
};

ChartBuilder.prototype.initChart = function () {
    var that = this;

    FusionChats.ready(function () {
        that.chart = new FusionChats ({
            type: 'column2D',
            renderAt: that.chartElm,
            height: '100%',
            width: '100%',
            dataFormat: 'json'
        });
    });
};

ChartBuilder.prototype.attachDragHandler = function () {
    var that = this;
    var dimDragger = Dragula([this.dimensionsElm, this.selectedDimensionsElm]);
    var mesDragger = Dragula([this.measuresElm, this.selectedMeasuresElm]);

    dimDragger.on('drop', function (el, target, source, sibling) {
        if (target === that.selectedDimensionsElm && source === that.dimensionsElm) {
            that.dimensions.pop(el.innerText);
            that.selectedDimensions.push(el.innerText);
        }

        if (target === that.dimensionsElm && source === that.selectedDimensionsElm) {
            that.dimensions.push(el.innerText);
            that.selectedDimensions.pop(el.innerText);
        }

        that.chartConstruct();
    });

    mesDragger.on('drop', function (el, target, source, sibling) {
        if (target === that.selectedMeasuresElm && source === that.measuresElm) {
            that.measures.pop(el.innerText);
            that.selectedMeasures.push(el.innerText);
        }

        if (target === that.measuresElm && source === that.selectedMeasuresElm) {
            that.measures.push(el.innerText);
            that.selectedMeasures.pop(el.innerText);
        }

        that.chartConstruct();
    });
};

ChartBuilder.prototype.parseData = function () {
    var that = this;

    fetch(this.dataUrl).then(function (resp) {
        return resp.json();
    }).then(function (json) {
        that.data = json;
        that.addDimensions(Object.getOwnPropertyNames(that.data));

        var firstDimChild = Object.getOwnPropertyNames(that.data[that.dimensions[0]])[0];
        that.addMeasures(Object.getOwnPropertyNames(that.data[that.dimensions[0]][firstDimChild]));
    }).catch(function () {
        console.log('There is an error is fetching data');
    });
};

ChartBuilder.prototype.addDimensions = function (dims) {
    var that = this;
    dims.forEach(function (dim) {
        var label = document.createElement('div');
        var text = document.createTextNode(dim);
        label.classList.add('label');
        label.classList.add('label-default');
        label.appendChild(text);
        that.dimensionsElm.appendChild(label);

        that.dimensions.push(dim);
    });
};

ChartBuilder.prototype.addMeasures = function (meas) {
    var that = this;
    meas.forEach(function (mes) {
        var label = document.createElement('div');
        var text = document.createTextNode(mes);
        label.classList.add('label');
        label.classList.add('label-default');
        label.appendChild(text);
        that.measuresElm.appendChild(label);

        that.measures.push(mes);
    });
};

ChartBuilder.prototype.chartConstruct = function () {
    var that = this;

    if (this.selectedDimensions.length < 1)
        return;

    if (this.selectedMeasures.length < 1)
        return;


    var selectedOption = this.typeSelectorElm.selectedOptions[0].value;
    var type = 'mscolumn2d';
    var dataSource;

    if (selectedOption === 'column') {
        type = 'mscolumn2d';
        dataSource = this.mscolumnDataBuilder();
    }
    else if (selectedOption === 'bar') {
        type = 'msbar2d';
        dataSource = this.mscolumnDataBuilder();
    }
    else if (selectedOption === 'pie') {
        type = 'pie2d';
        dataSource = this.pieDataBuilder();
    }

    console.log('Constructing now');
    console.log(this.selectedDimensions);
    console.log(this.selectedMeasures);

    var chartLiteral = {
        type: type,
        renderAt: this.chartElm,
        height: '100%',
        width: '100%',
        dataFormat: 'json',
        dataSource: dataSource
    };

    FusionChats.ready(function () {
        that.chart = new FusionChats(chartLiteral).render();
    });
};

ChartBuilder.prototype.mscolumnDataBuilder = function () {
    var chart = {};

    var category = [];
    for (var i = 0; i < this.selectedDimensions.length; i++) {
        var sd = this.selectedDimensions[i];

        var dimKeys = Object.keys(this.data[sd]);
        for (var j = 0; j < dimKeys.length; j++) {
            category.push({
                label: dimKeys[j]
            });
        }

        category.push({
            vLine: true
        });
    }
    var categories = [{
        category: category
    }];
    console.log(categories);

    var dataset = [];
    for (var i = 0; i < this.selectedMeasures.length; i++) {
        var sm = this.selectedMeasures[i];
        var smData = [];

        for (var j = 0; j < categories[0].category.length; j++) {
            var cat = categories[0].category[j];

            if (!cat.label)
                continue;

            var val;

            for (var k = 0; k < this.selectedDimensions.length; k++) {
                // console.log(this.selectedDimensions[k], cat.label, sm);
                if (this.data[this.selectedDimensions[k]][cat.label]) {
                    val = this.data[this.selectedDimensions[k]][cat.label][sm];
                }
            }

            smData.push({
                value: val
            });
        }

        dataset.push({
            seriesname: sm,
            data: smData
        });
    }
    console.log(dataset);

    return {
        chart: chart,
        categories: categories,
        dataset: dataset
    };
};

ChartBuilder.prototype.pieDataBuilder = function () {
    var chart = {};
    var data = [];

    for (var i = 0; i < this.selectedDimensions.length; i++) {
        var sd = this.selectedDimensions[i];
        var labels = Object.keys(this.data[sd]);
        for (var j = 0; j < labels.length; j++) {
            var label = labels[j];
            var value = this.data[sd][label][this.selectedMeasures[0]];
            var obj = {
                label: label,
                value: value
            };

            data.push(obj);
        }
    }
    console.log(data);

    return {
        chart: chart,
        data: data
    };
};


window.addEventListener('load', function () {
    window.chartBuilder = new ChartBuilder();
});