// Vehicles -- {name: String,
//              lat: Number,
//              long: Number}
Vehicles = new Meteor.Collection("vehicles");

Meteor.publish('vehicles', function () {
  return Vehicles.find();
});

