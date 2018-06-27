import React, { Component } from 'react';
import {BarChart} from 'react-easy-chart'

import {processImages, getStatus} from './services/imageServices';

import './App.css';

class App extends Component {
  imageDetectionInterval;
  initialState = {
    status: 'BEGIN',
    display: null
  };

  constructor(props) {
    super(props);
    this.state = this.initialState;
  }

  componentWillMount() {
    this.initImageDetection();
    this.getFilesFromCSV();
  }
  componentDidMount() {
    // TODO: refactor; currently waiting for 5 seconds before starting to fetch the detect response

    setTimeout(()=>{
      this.startImageProcessing();
      this.imageDetectionInterval = setInterval(this.startImageProcessing, 2000);
    }, 5000);
    
    // TODO: for now using timeout to refresh because I am looking at COMPLETED_SUCCESSFULLY and IN-PROGRESS statuses only
    // and there are other statuses (PARTIAL-ERROR) too because of which it doesn't stop fetching
    // Because of this the total number of files is also coming incorrectly 
    setTimeout(()=>{
      clearInterval(this.imageDetectionInterval);
      this.setState({
        status: 'COMPLETE'
      });
    }, 20000);
  }

  /**
   * Parse CSV
   */
  getFilesFromCSV = async () => {
    const response = await fetch('/parse-csv');
    const images = await response.json();

    const allImages = [].concat(images.images);

    const imageBatches = [];
    while(allImages.length) {
      imageBatches.push(allImages.splice(0,64));
    }

    this.setState({
      imageBatches
    });

  };

  /**
   * Start the image detection process 
   */
  initImageDetection = async () => {
    const response = await fetch('/fetch-token');
    const token = await response.json();

    this.setState({
      token,
      batches: []
    });

    const imageBatches = this.state.imageBatches;

    imageBatches.forEach((batch) => {
      processImages(batch).then(res => {
        const reqBatches = [].concat(this.state.batches);
        reqBatches.push({
          id: res.id,
          status: res.status,
          images: batch
        })
        this.setState({
          status: 'IP',
          batches: reqBatches
        });
      });
    });
  };

  /**
   * Analyse image detection results.
   */
  startImageProcessing = async () => {
    const batches = [].concat(this.state.batches);
    const pendingBatches = batches.filter(b => b.status==='IN_PROGRESS');

    if (!pendingBatches.length) {
      this.setState({
        status: 'COMPLETE'
      });
      return;
    }

    pendingBatches.forEach((batch) => {
      getStatus(batch.id).then(res => {
        if (res.status === "COMPLETED_SUCCESSFULLY") {
          const processed = [].concat(this.state.allProcessed);
          for (let i=0; i<batches.length; i++){
            if (batches[i].id === batch.id){
              batches[i].status = "COMPLETED_SUCCESSFULLY";
              break;
            }
          }
          processed.push(...res.imageResults.map(ir => ({
            x: ir.url,
            y: 100,
            confidence: ir.objects[0].confidence,
            color: ir.objects[0].confidence >= 0.9 ? '#0A0' : '#A00',
            timestamp: ir.url.replace('http://www.homescript.io/images/', '').replace('.jpg', '')
          })));
          this.setState({
            allProcessed: processed,
            batches
          });
        }
      });
    });
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">GoScript Image Processor</h1>
        </header>
        <div className="App-intro">
          {
            this.state.status === 'COMPLETE'
            ? (
            <div>
              <BarChart
                height={150}
                width={1000}
                data={this.state.allProcessed.filter(a => a && a.x && a.y)}
                clickHandler={(d) => this.setState({display: d.x, timestamp: d.timestamp, confidence: d.confidence})}
              />
              {this.state.display &&
                <div>
                  <img src={this.state.display} width='400' alt='' />
                  <div>Timestamp: {this.state.timestamp}, Confidence: {this.state.confidence}</div>
                </div>
              }
            </div>
            )
            : (<div>In Progress. Please wait.</div>)
          }
        </div>
      </div>
    );
  }
}

export default App;
