var clusterMaster = require("cluster-master")

// most basic usage: just specify the worker
// Spins up as many workers as you have CPUs
//
// Note that this is VERY WRONG for a lot of multi-tenanted
// VPS environments where you may have 32 CPUs but only a
// 256MB RSS cap or something.
clusterMaster("app.js")

