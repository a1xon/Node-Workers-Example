const numCPUs = require('os').cpus().length;
const { Worker, MessageChannel} = require('worker_threads');

/*
 
 ███████╗██████╗ ██╗███╗   ██╗    ██╗   ██╗██████╗ 
 ██╔════╝██╔══██╗██║████╗  ██║    ██║   ██║██╔══██╗
 ███████╗██████╔╝██║██╔██╗ ██║    ██║   ██║██████╔╝
 ╚════██║██╔═══╝ ██║██║╚██╗██║    ██║   ██║██╔═══╝ 
 ███████║██║     ██║██║ ╚████║    ╚██████╔╝██║     
 ╚══════╝╚═╝     ╚═╝╚═╝  ╚═══╝     ╚═════╝ ╚═╝     
                                                   
 
*/

const workerPoolSize = numCPUs - 1; // works best for me
const portsPerWorker = 3;

let workerPool = [];
let workerDuties = new Map();

console.log('Creating worker pool...');

const spinUp = () => {
  return new Promise(function(resolve, reject) {
	  let greenLights = 0;
	  for (let workerIndex = 0; workerIndex < workerPoolSize; workerIndex++) {
      let worker = new Worker('./worker.js');
      ///Give each worker more subchannels
      worker.subChannels = [];
      for (let i = 0; i < portsPerWorker; i++) {
        worker.subChannels.push(new MessageChannel());
      }
      ///extract the ports
      worker.subPorts = worker.subChannels.reduce((acc, obj) => {
        acc.push(obj.port1);
        return acc;
      }, []);

      worker.currentPort = 0;
      workerPool.push(worker);

      worker.postMessage({ hereAreYourPorts: worker.subPorts, answerOnPort: worker.currentPort }, worker.subPorts);
      worker.subChannels[worker.currentPort].port2.once('message', value => {
        if (value === 'ok') {
          greenLights++;
        }
        if (greenLights >= workerPoolSize) {
          resolve(console.log('\x1b[32m', `${workerPool.length} workers are inside the pool`));
        }
      });
      worker.once('error', reject);
      worker.once('exit', code => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
      });
    }
  });
};

/*
 
 ███╗   ███╗ █████╗ ██╗███╗   ██╗
 ████╗ ████║██╔══██╗██║████╗  ██║
 ██╔████╔██║███████║██║██╔██╗ ██║
 ██║╚██╔╝██║██╔══██║██║██║╚██╗██║
 ██║ ╚═╝ ██║██║  ██║██║██║ ╚████║
 ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
                                 
 
*/

const main = async someArgument => {

  //get an id for the process
  let processID = Math.floor(Math.random() * 99999999) + 1;
  let results = [];

  workerDuties.set(processID, []);
  let allWorkersPromise = new Promise((resolve, reject) => {
    for (let [index, worker] of workerPool.entries()) {
      // spin or rewind port
      worker.currentPort = worker.currentPort < portsPerWorker - 1 ? worker.currentPort + 1 : 0; 
      // post the message
      worker.postMessage({ someArgument: someArgument, processID: processID, answerOnPort: worker.currentPort, workerId: index});

	    worker.subChannels[worker.currentPort].port2.once('message', value => {
        //capture data even when it's not from this function call - safety net
        workerDuties.get(value.processID).push(value.result);
        //resolve when all results are back
        if (workerDuties.get(value.processID).length === workerPool.length && value.processID === processID) {
          resolve(workerDuties.get(value.processID));
        }
      });
      worker.subChannels[worker.currentPort].port2.once('error', reject);
      worker.subChannels[worker.currentPort].port2.once('exit', reject);
    }
  });

  //wait for all workers
  results = await allWorkersPromise;
  //delete process and results from map
  workerDuties.delete(processID);
  return results;
};

/*
 
 ██╗███╗   ██╗██╗████████╗██╗ █████╗ ██╗     ██╗███████╗███████╗
 ██║████╗  ██║██║╚══██╔══╝██║██╔══██╗██║     ██║╚══███╔╝██╔════╝
 ██║██╔██╗ ██║██║   ██║   ██║███████║██║     ██║  ███╔╝ █████╗  
 ██║██║╚██╗██║██║   ██║   ██║██╔══██║██║     ██║ ███╔╝  ██╔══╝  
 ██║██║ ╚████║██║   ██║   ██║██║  ██║███████╗██║███████╗███████╗
 ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   ╚═╝╚═╝  ╚═╝╚══════╝╚═╝╚══════╝╚══════╝
                                                                
 
*/

const startUpProcess = async () => {
  let results = [];
  console.log('\x1b[37m', 'Spinning up Workers...');
  await spinUp();
  console.log('\x1b[32m', 'Spinning up Workers...Done');
  console.log('\x1b[37m', '---');

  ///now main can be called in a high frequency and can even overlap a bit
  ///having more workers than cpus seems to be not clever so this is just a fallback
  
  for (let i = 0; i <= 1; i++) {
    results.push(main('something to calculate'));
  }
  console.log(await Promise.all(results));
};

startUpProcess();
