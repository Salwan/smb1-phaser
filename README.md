# smb1-phaser
First level of SMB1 using Typescript and Phaser, done for fun :)

# Known Issues
- When controller is disconnected and reconnected an error in Phaser is thrown. It's probably due to not listening for disconnected/connected events and updating pad reference.
- Mario walking across gapped blocks works every other time. Should work consistently. Once jump edge correction is implemented this could be solved.
- When mario jumps hit the top of the screen it acts like hitting a block. It should go through and back into the screen.
