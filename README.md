# smb1-phaser
First level of SMB1 using Typescript and Phaser, done for fun :)

# Known Issues
- When controller is disconnected and reconnected an error in Phaser is thrown.
- It's probably due to not listening for disconnected/connected events and updating pad reference.
