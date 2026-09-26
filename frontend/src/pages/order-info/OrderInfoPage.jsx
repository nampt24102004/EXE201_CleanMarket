import CustomerInfoForm from '../../components/order/CustomerInfoForm'

function OrderInfoPage({ customerInfo, onCustomerInfoChange, validationErrors }) {
  return (
    <CustomerInfoForm
      customerInfo={customerInfo}
      onChange={onCustomerInfoChange}
      validationErrors={validationErrors}
    />
  )
}

export default OrderInfoPage
