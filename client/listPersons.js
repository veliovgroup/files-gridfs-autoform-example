import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';            // optional, default theme
import '@fortawesome/fontawesome-free/js/all.js'; // optional, is using FA5
import popper from 'popper.js';

import 'meteor/aldeed:autoform/static';
import { Template }      from 'meteor/templating';
import { Persons }       from '/lib/persons.js';
import { ReactiveVar }   from 'meteor/reactive-var';

import { AutoForm } from 'meteor/aldeed:autoform';
import { AutoFormThemeBootstrap4 } from 'meteor/communitypackages:autoform-bootstrap4/static';

AutoFormThemeBootstrap4.load();
AutoForm.setDefaultTemplate('bootstrap4');

window.Popper = popper;
window.Persons = Persons;

Template.listPersons.onCreated(function(){
  this.update = new ReactiveVar(false);
  this.autorun(() => {
    this.subscribe('persons');
  });
});

Template.listPersons.helpers({
  persons() {
    return Persons.find({});
  },
  getFormId() {
    return 'updatePerson' + this._id;
  },
  update(_id) {
    return Template.instance().update.get() === _id;
  }
});

Template.listPersons.events({
  'click [data-button-update]'(e, template) {
    e.preventDefault();
    template.update.set(template.update.get() === this._id ? false : this._id);
    return false;
  }
});
