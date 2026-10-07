import React from 'react'
import { useProduct } from '../hooks/useProduct'

const CreateProduct = () => {

    const { handleCreateProduct } = useProduct()
  return (
    <div>
      CreateProduct
    </div>
  )
}

export default CreateProduct


