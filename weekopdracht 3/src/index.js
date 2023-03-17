let model
let videoWidth, videoHeight
let ctx, canvas
let datawithoutz = []
let rock = 0
let paper = 0
let scissor = 0
const log = document.querySelector("#array")
const VIDEO_WIDTH = 720
const VIDEO_HEIGHT = 405
const k = 3
const machine = new kNear(k)

const labelOneBtn = document.querySelector("#paper");
const labelTwoBtn = document.querySelector("#rock");
const labelThreeBtn = document.querySelector("#scissor");
const labelFourBtn = document.querySelector("#predict");

//
// start de applicatie
//
async function main() {
    model = await handpose.load()
    const video = await setupCamera()
    video.play()
    startLandmarkDetection(video)
    labelOneBtn.addEventListener("click", () => learnPaper());
    labelTwoBtn.addEventListener("click", () => learnRock());
    labelThreeBtn.addEventListener("click", () => learnScissor());
    labelFourBtn.addEventListener("click", () => predict());
}

//
// start de webcam
//
async function setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
            "Webcam not available"
        )
    }

    const video = document.getElementById("video")
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            facingMode: "user",
            width: VIDEO_WIDTH,
            height: VIDEO_HEIGHT
        }
    })
    video.srcObject = stream

    return new Promise(resolve => {
        video.onloadedmetadata = () => {
            resolve(video)
        }
    })
}

//
// predict de vinger posities in de video stream
//
async function startLandmarkDetection(video) {

    videoWidth = video.videoWidth
    videoHeight = video.videoHeight

    canvas = document.getElementById("output")

    canvas.width = videoWidth
    canvas.height = videoHeight

    ctx = canvas.getContext("2d")

    video.width = videoWidth
    video.height = videoHeight

    ctx.clearRect(0, 0, videoWidth, videoHeight)
    ctx.strokeStyle = "red"
    ctx.fillStyle = "red"

    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1) // video omdraaien omdat webcam in spiegelbeeld is

    predictLandmarks()
}

//
// predict de locatie van de vingers met het model
//
async function predictLandmarks() {
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight, 0, 0, canvas.width, canvas.height)
    // prediction!
    const predictions = await model.estimateHands(video) // ,true voor flip
    if (predictions.length > 0) {
        drawHand(ctx, predictions[0].landmarks, predictions[0].annotations)
    }
    // 60 keer per seconde is veel, gebruik setTimeout om minder vaak te predicten
    requestAnimationFrame(predictLandmarks)
    // setTimeout(()=>predictLandmarks(), 1000)
}


//
// teken hand en vingers met de x,y coordinaten. de z waarde tekenen we niet.
//
function drawHand(ctx, keypoints, annotations) {
    // toon alle x,y,z punten van de hele hand in het log venster
    log.innerText = keypoints.flat()
    //console.log(keypoints)
    datawithoutz = []

    // punten op alle kootjes kan je rechtstreeks uit keypoints halen 
    for (let i = 0; i < keypoints.length; i++) {
        const y = keypoints[i][0]
        const x = keypoints[i][1]
        datawithoutz.push(y)
        datawithoutz.push(x)
        drawPoint(ctx, x - 2, y - 2, 3)
    }
  

    // palmbase als laatste punt toevoegen aan elke vinger
    let palmBase = annotations.palmBase[0]
    for (let key in annotations) {
        const finger = annotations[key]
        finger.unshift(palmBase)
        drawPath(ctx, finger, false)
    }
}

//
// teken een punt
//
function drawPoint(ctx, y, x, r) {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, 2 * Math.PI)
    ctx.fill()
}
//
// teken een lijn
//
function drawPath(ctx, points, closePath) {
    const region = new Path2D()
    region.moveTo(points[0][0], points[0][1])
    for (let i = 1; i < points.length; i++) {
        const point = points[i]
        region.lineTo(point[0], point[1])
    }

    if (closePath) {
        region.closePath()
    }
    ctx.stroke(region)
}

function learnPaper(){
    if (paper == 15){
        console.log("Data already full")    
    }
    else {
        machine.learn(datawithoutz, "paper")
    paper += 1
    console.log(datawithoutz)
    console.log("paper")
    console.log(paper)
    }
}

function learnRock(){
    if (rock == 15){
        console.log("Data already full")   
    }
    else{
    machine.learn(datawithoutz, "rock")
    rock += 1
    console.log(datawithoutz)
    console.log("rock")
    console.log(rock)
    }
}

function learnScissor(){
    if(scissor == 15)
    {
        console.log("Data already full")   
    }
    else{
    machine.learn(datawithoutz, "scissor")
    scissor += 1
    console.log(datawithoutz)
    console.log("scissor")
    console.log(scissor)
    }
}

function predict(){
    if (rock == 15 && paper == 15 && scissor == 15)
    {
    let prediction = machine.classify(datawithoutz)
    console.log(`I think it's ${prediction}`)
    }
    else {
        console.log("need more data")
    }
}

//
// start
//
main()



