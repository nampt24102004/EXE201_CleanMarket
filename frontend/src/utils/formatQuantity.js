const formatQuantity = (value) => {
  if (Number.isInteger(value)) {
    return String(value)
  }

  return value.toFixed(1)
}

export default formatQuantity
