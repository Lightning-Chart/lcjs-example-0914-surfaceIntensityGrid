/**
 * Example showcasing the Surface Grid Series feature of LightningChart JS with separate data sets for height and Intensity
 */

const lcjs = require('@arction/lcjs')
const xydata = require('@arction/xydata')
const {
    lightningChart,
    LUT,
    PalettedFill,
    ColorShadingStyles,
    ColorRGBA,
    LegendBoxBuilders,
    UIElementBuilders,
    UIOrigins,
    UIDraggingModes,
    emptyFill,
    emptyLine,
    UILayoutBuilders,
    Themes
} = lcjs
const {
    createWaterDropDataGenerator
} = xydata

const COLUMNS = 100
const ROWS = 100

const chart = lightningChart().Chart3D({
    disableAnimations: true,
    // theme: Themes.darkGold
})
    .setTitle('Generating example data ...')

Promise.all([
    // Generate Height map data set.
    createWaterDropDataGenerator()
        .setColumns(COLUMNS)
        .setRows(ROWS)
        .setWaterDrops([
            {
                rowNormalized: 0.5,
                columnNormalized: 0.5,
                amplitude: 20,
            },
        ])
        .generate(),
    // Generate intensity data set.
    createWaterDropDataGenerator()
        .setColumns(COLUMNS)
        .setRows(ROWS)
        .setVolatility(10)
        .setWaterDrops([
            {
                columnNormalized: 0.22,
                rowNormalized: 0.2,
                amplitude: 80,
            },
            {
                columnNormalized: 0.4,
                rowNormalized: 0.7,
                amplitude: 70,
            },
            {
                columnNormalized: 0.8,
                rowNormalized: 0.3,
                amplitude: 100,
            },
        ])
        .generate()
])
    .then((dataSets) => {
        chart.setTitle('Rendering data ...')
        requestAnimationFrame(() => {
            const tStart = performance.now()
            const heightDataSet = dataSets[0]
            const intensityDataSet = dataSets[1]

            const surfaceGrid = chart
                .addSurfaceGridSeries({
                    dataOrder: 'rows',
                    columns: COLUMNS,
                    rows: ROWS,
                })
                .setIntensityInterpolation('bilinear')
                .invalidateHeightMap(heightDataSet)
                .invalidateIntensityValues(intensityDataSet)

            requestAnimationFrame(() => {
                const tNow = performance.now()
                const tLoadupMs = tNow - tStart
                chart.setTitle(`Intensity Surface Grid ${COLUMNS}x${ROWS} (${((COLUMNS*ROWS)/10**3).toFixed(1)} thousand data points) | Ready in ${(tLoadupMs/1000).toFixed(2)} s`)
                
                // Add selector to see difference between Simple and Phong 3D color shading style in Surface grid series.
                const layout = chart.addUIElement(UILayoutBuilders.Column)
                    .setPosition({ x: 100, y: 100 })
                    .setOrigin(UIOrigins.RightTop)
                    .setMargin({top: 40, right: 8})
                    .setDraggingMode(UIDraggingModes.notDraggable)
                const selectorColorShadingStyle = layout.addElement(UIElementBuilders.CheckBox)
                selectorColorShadingStyle.onSwitch((_, state) => {
                    surfaceGrid.setColorShadingStyle(state ? new ColorShadingStyles.Phong() : new ColorShadingStyles.Simple())
                    selectorColorShadingStyle.setText(`Color shading style: ${state ? 'Phong' : 'Simple'}`)
                })
                selectorColorShadingStyle.setOn(false)

                // Add selector for wireframe only style.
                const defaultWireframeStyle = surfaceGrid.getWireframeStyle()
                const selectorWireframe = layout.addElement(UIElementBuilders.CheckBox)
                selectorWireframe.onSwitch((_, state) => {
                    if (state) {
                        surfaceGrid
                            .setFillStyle(emptyFill)
                            .setWireframeStyle(defaultStrokeStyle.setThickness(0.1))
                    } else {
                        surfaceGrid
                            .setFillStyle(
                                new PalettedFill({
                                    lookUpProperty: 'value',
                                    lut: new LUT({
                                        interpolate: true,
                                        steps: [
                                            { value: 0, color: ColorRGBA(255, 215, 0) },
                                            { value: 100, color: ColorRGBA(255, 0, 0) },
                                            { value: 200, color: ColorRGBA(0, 0, 255) },
                                        ],
                                    }),
                                }),
                            )
                            .setWireframeStyle(defaultWireframeStyle)
                    }
                    selectorWireframe.setText(state ? `Wireframe only` : 'Fill + Wireframe')
                })
                selectorWireframe.setOn(false)

                // Add legend.
                const legend = chart.addLegendBox(LegendBoxBuilders.HorizontalLegendBox).add(chart)
            })
        })
    })

let tempLineSeries = chart.addLineSeries()
const defaultStrokeStyle = tempLineSeries.getStrokeStyle()
tempLineSeries.dispose()
tempLineSeries = undefined