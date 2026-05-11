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
  return {
    $class: PROPERTY_CLASS_MAP[field.type] || PROPERTY_CLASS_MAP.String,
    name: field.name,
    isArray: false,
    isOptional: !!field.optional,
    decorators: [
      createDecorator('Term', field.label),
      crudDecorator(field.readableOnly)
    ]
  };
}

function createConceptTypeDefinitions({ typeName, term, identifiedBy, fields }) {
  return {
    declarations: [
      {
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
      }
    ]
  };
}

module.exports = {
  METAMODEL,
  createConceptTypeDefinitions,
  mm,
  PROPERTY_CLASS_MAP,
  createDecorator,
  crudDecorator,
  createPropertyDeclaration
};
