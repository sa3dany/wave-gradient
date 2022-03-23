/** @module */

/**
 * Converts string to sentence case. Expects a single word.
 * @param {string} name
 * @returns {string}
 */
function sentenceCase(name) {
  // TODO: remove this check after re-implementing the shaders
  if (name.startsWith("u_")) {
    return name.replace("u_", "")[0].toUpperCase() + name.slice(3);
  }

  return name[0].toUpperCase() + name.slice(1);
}

/**
 * Returns the declaration for the uniform based on its data type. For
 * structs, it also prepends the struct definition before the uniform
 * declaration.
 * @param {*} uniform key, valye pair of uniform
 * @param {*} options
 * @returns {string} the GLSL uniform variable declaration
 */
function declareUniform([name, value], options = {}) {
  const isStruct = !!options.isStruct;
  const prefix = !isStruct ? "uniform" : "";

  if (value === null) {
    throw new Error("null is not a valid GLSL type");
  }

  switch (typeof value) {
    case "number":
      // GLSL float
      return `${prefix} float ${name};`;

    case "boolean":
      // GLSL bool
      return `${prefix} bool ${name};`;

    case "object":
      // GLSL vec[2-4]
      if (
        value instanceof Float32Array &&
        value.length >= 2 &&
        value.length <= 4
      ) {
        return `${prefix} vec${value.length} ${name};`;
      }

      // GLSL vec3 color
      if (value.isColor === true) {
        return `${prefix} vec3 ${name};`;
      }

      // GLSL vec[2-4]
      if (value instanceof Float32Array && value.length > 4) {
        throw new Error("Not implemented");
      }

      // GLSL array of structs
      if (
        Array.isArray(value) &&
        value.every((u) => {
          return typeof u === "object" && !Array.isArray(u);
        })
      ) {
        const typeName = sentenceCase(name);
        return `
struct ${typeName} {
 ${Object.entries(value[0])
   .map((uniform) => declareUniform(uniform, { isStruct: true }))
   .join("\n")}
};
uniform ${typeName} ${name}[${value.length}];
const int ${name}_length = ${value.length};`;
      }

      // GLSL struct
      const typeName = sentenceCase(name);
      return `
struct ${typeName} {
 ${Object.entries(value)
   .map((uniform) => declareUniform(uniform, { isStruct: true }))
   .join("\n")}
};
uniform ${typeName} ${name};`;

    default:
      return "";
  }
}

/**
 * Returns the attribute declaration for the provided attribute based on
 * its item size.
 * @param {THREE.BufferAttribute[]} attribute
 * @returns {string} GLSL attribute declaration
 */
function declareAttribute(attribute) {
  if (attribute.itemSize > 4) {
    throw new Error(`Unexpected attribute itemSize: ${attribute.itemSize}`);
  }
  return `attribute vec${attribute.itemSize} ${attribute.name};`;
}

/**
 * Generates the required variable and struct declarations inside GLSL
 * shader files based on the provided uniforms object or attributes
 * array.
 * @param {Object|THREE.BufferAttribute[]} variables
 * @returns {string}
 */
export function getDeclarations(variables) {
  if (
    Array.isArray(variables) &&
    variables.every((v) => v.isBufferAttribute === true)
  ) {
    return variables.map((attribute) => declareAttribute(attribute)).join("\n");
  } else {
    return Object.entries(variables)
      .map(([name, data]) => declareUniform([name, data.value]))
      .join("\n");
  }
}
