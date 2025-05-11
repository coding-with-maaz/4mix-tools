const net = require('net');

const isPortAvailable = (port) => {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.once('error', () => {
            resolve(false);
        });
        
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        
        server.listen(port);
    });
};

const findAvailablePort = async (startPort) => {
    let port = startPort;
    while (!(await isPortAvailable(port))) {
        port++;
    }
    return port;
};

module.exports = {
    isPortAvailable,
    findAvailablePort
}; 