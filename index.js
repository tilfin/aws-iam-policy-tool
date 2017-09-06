module.exports = {
  exportPolicy: require('./lib/export_policy'),
  exportRole:   require('./lib/export_role'),
  importPolicy: require('./lib/import_policy'),
  importRole:   require('./lib/import_role'),
  validatePolicy: require('./lib/validate_policy'),
  validateRole: require('./lib/validate_role'),  
  deletePolicy: require('./lib/delete_policy'),
}
