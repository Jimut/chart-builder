const Dragula = require('dragula');
const FusionChats = require('fusioncharts');
require("fusioncharts/fusioncharts.charts")(FusionCharts);


var ChartBuilder = function (dataUrl) {
    this.chartElm = document.getElementById('chart');
    this.dimensionsElm = document.getElementById('dimensions');
    this.selectedDimensionsElm = document.getElementById('selectedDimensions');
    this.measuresElm = document.getElementById('measures');
    this.selectedMeasuresElm = document.getElementById('selectedMeasures');
    this.typeSelectorElm = document.getElementById('typeSelector');
    this.dataUrl = dataUrl;

    this.dimensions = [];
    this.selectedDimensions = [];
    this.measures = [];
    this.selectedMeasures = [];

    this.attachDragHandler();
    this.parseData();

    this.typeSelectorElm.addEventListener('change', this.chartConstruct.bind(this));
};

ChartBuilder.prototype.parseData = function () {
    var that = this;

    fetch(this.dataUrl).then(function (resp) {
        return resp.json();
    }).then(function (json) {
        that.data = json;

        that.addDimensions(Object.keys(that.data));

        var firstDim = that.data[that.dimensions[0]];
        var firstDimChild = Object.keys(firstDim)[0];

        that.addMeasures(Object.keys(firstDim[firstDimChild]));
    }).catch(function () {
        console.log('There is an error is fetching and storing data');
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

ChartBuilder.prototype.attachDragHandler = function () {
    var that = this;
    var dimDragger = Dragula([this.dimensionsElm, this.selectedDimensionsElm]);
    var mesDragger = Dragula([this.measuresElm, this.selectedMeasuresElm]);

    var arrayRemove = function (arr, elm) {
        var index = arr.indexOf(elm);
        if (index > -1) {
            arr.splice(index, 1);
        }
    };

    dimDragger.on('drop', function (el, target, source, sibling) {
        if (target === that.selectedDimensionsElm && source === that.dimensionsElm) {
            that.selectedDimensions.push(el.innerText);
            arrayRemove(that.dimensions, el.innerText);
        }

        if (target === that.dimensionsElm && source === that.selectedDimensionsElm) {
            that.dimensions.push(el.innerText);
            arrayRemove(that.selectedDimensions, el.innerText);
        }

        that.chartConstruct();
    });

    mesDragger.on('drop', function (el, target, source, sibling) {
        if (target === that.selectedMeasuresElm && source === that.measuresElm) {
            that.selectedMeasures.push(el.innerText);
            arrayRemove(that.measures, el.innerText);
        }

        if (target === that.measuresElm && source === that.selectedMeasuresElm) {
            that.measures.push(el.innerText);
            arrayRemove(that.selectedMeasures, el.innerText);
        }

        that.chartConstruct();
    });
};

ChartBuilder.prototype.chartConstruct = function () {
    var that = this;

    if (this.chart !== undefined && !this.chart.disposed)
        this.chart.dispose();

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

    // console.log('Constructing now');
    // console.log('Dimensions', this.selectedDimensions);
    // console.log('Measures', this.selectedMeasures);

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
    
    // console.log('categories', categories);

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

    // console.log('dataset', dataset);

    return {
        chart: chart,
        categories: categories,
        dataset: dataset
    };
};

ChartBuilder.prototype.pieDataBuilder = function () {
    var chart = {};
    chart.caption = this.selectedMeasures[0];

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

    // console.log('data', data);

    return {
        chart: chart,
        data: data
    };
};


window.addEventListener('load', function () {
    window.chartBuilder = new ChartBuilder('/data/data.json');
});
