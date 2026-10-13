import CustomerInfoForm from '../../components/order/CustomerInfoForm'

function OrderInfoPage({ customerInfo, onCustomerInfoChange, validationErrors, shippingZones, shippingZoneCode, onShippingZoneChange, shippingZonesLoading, shippingZonesError }) {
  return (
    <CustomerInfoForm
      customerInfo={customerInfo}
      onChange={onCustomerInfoChange}
      validationErrors={validationErrors}
      shippingZones={shippingZones}
      shippingZoneCode={shippingZoneCode}
      onShippingZoneChange={onShippingZoneChange}
      shippingZonesLoading={shippingZonesLoading}
      shippingZonesError={shippingZonesError}
    />
  )
}

export default OrderInfoPage
