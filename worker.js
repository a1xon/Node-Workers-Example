const assert = require('assert');
const { MessagePort, parentPort } = require('worker_threads');

let lastProcessID = 0;
let workerPorts = [];

parentPort.on('message', (value) => {
	
/*
 
 ███████╗██████╗ ██╗███╗   ██╗    ██╗   ██╗██████╗ 
 ██╔════╝██╔══██╗██║████╗  ██║    ██║   ██║██╔══██╗
 ███████╗██████╔╝██║██╔██╗ ██║    ██║   ██║██████╔╝
 ╚════██║██╔═══╝ ██║██║╚██╗██║    ██║   ██║██╔═══╝ 
 ███████║██║     ██║██║ ╚████║    ╚██████╔╝██║     
 ╚══════╝╚═╝     ╚═╝╚═╝  ╚═══╝     ╚═════╝ ╚═╝     
                                                   
 
*/

	if (value.hereAreYourPorts !== undefined && value.answerOnPort !== undefined) {
		for (let port of value.hereAreYourPorts) {
			assert(port instanceof MessagePort);
			workerPorts.push(port);
		}
		
		console.log('\x1b[37m', `Worker recieved ${workerPorts.length} ports`);

		workerPorts[value.answerOnPort].postMessage('ok');
  	}

/*
 
 ██╗    ██╗ ██████╗ ██████╗ ██╗  ██╗███████╗██████╗     ███╗   ███╗ █████╗ ██╗███╗   ██╗
 ██║    ██║██╔═══██╗██╔══██╗██║ ██╔╝██╔════╝██╔══██╗    ████╗ ████║██╔══██╗██║████╗  ██║
 ██║ █╗ ██║██║   ██║██████╔╝█████╔╝ █████╗  ██████╔╝    ██╔████╔██║███████║██║██╔██╗ ██║
 ██║███╗██║██║   ██║██╔══██╗██╔═██╗ ██╔══╝  ██╔══██╗    ██║╚██╔╝██║██╔══██║██║██║╚██╗██║
 ╚███╔███╔╝╚██████╔╝██║  ██║██║  ██╗███████╗██║  ██║    ██║ ╚═╝ ██║██║  ██║██║██║ ╚████║
  ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝    ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
                                                                                        
 
*/

	if (value.someArgument !== undefined && value.processID !== undefined && value.workerId !== undefined && lastProcessID !== value.processID) {
		lastProcessID = value.processID;
		/// Do some heavy lifting here
		let result = value.someArgument + ' - done by a worker || on port ' + value.answerOnPort;

		workerPorts[value.answerOnPort].postMessage({
			result: result,
			processID: value.processID,
			workerId: value.workerId
		});
  	}
  });