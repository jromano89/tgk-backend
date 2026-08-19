// ── Concerto metamodel helpers (v1.0.0) ───────────────────────────────

const METAMODEL = 'concerto.metamodel@1.0.0';

function mm(className) {
  return `${METAMODEL}.${className}`;
}

const PROPERTY_CLASS_MAP = {
  String: mm('StringProperty'),
  Double: mm('DoubleProperty'),
  Integer: mm('IntegerProperty'),
  Long: mm('LongProperty'),
  DateTime: mm('DateTimeProperty'),
  Boolean: mm('BooleanProperty')
};

function createDecorator(name, value) {
  return {
    $class: mm('Decorator'),
    name,
    arguments: [
      {
        $class: mm('DecoratorString'),
        value
      }
    ]
  };
}

function crudDecorator(readableOnly) {
  return createDecorator('Crud', readableOnly ? 'Readable' : 'Createable,Readable,Updateable');
}

function createPropertyDeclaration(field) {
  const property = {
    $class: field.objectType ? mm('ObjectProperty') : (PROPERTY_CLASS_MAP[field.type] || PROPERTY_CLASS_MAP.String),
    name: field.name,
    isArray: !!field.isArray,
    isOptional: !!field.optional,
    decorators: [
      createDecorator('Term', field.label),
      crudDecorator(field.readableOnly)
    ]
  };

  if (field.objectType) {
    property.type = field.objectType;
  }

  return property;
}

function createConceptDeclaration({ typeName, term, identifiedBy, fields }) {
  return {
    $class: mm('ConceptDeclaration'),
    name: typeName,
    isAbstract: false,
    identified: {
      $class: mm('IdentifiedBy'),
      name: identifiedBy
    },
    decorators: [
      createDecorator('Term', term),
      crudDecorator(false)
    ],
    properties: fields.map(createPropertyDeclaration)
  };
}

function createConceptTypeDefinitions({ typeName, term, identifiedBy, fields }) {
  return {
    declarations: [createConceptDeclaration({ typeName, term, identifiedBy, fields })]
  };
}

module.exports = {
  METAMODEL,
  createConceptDeclaration,
  createConceptTypeDefinitions,
  mm,
  PROPERTY_CLASS_MAP,
  createDecorator,
  crudDecorator,
  createPropertyDeclaration
};
