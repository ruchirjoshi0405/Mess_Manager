import React, { useState } from 'react'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

const ProductImage = ({ images }) => {
    const [mainImg, setMainImg] = useState(images[0].url)
    return (
        <div className='flex gap-5 w-max'>
            <div className='gap-5 flex flex-col'>
                {
                    images.map((image) => {
                        return <img onClick={() => setMainImg(image.url)} src={image.url} alt="" className='cursor-pointer w-20 h-20 border shadow-lg' />
                    })
                }
            </div>
            <Zoom>
                <img src={mainImg} alt="" className='w-[500px] border shadow-lg' />
            </Zoom>
        </div>

    )
}

export default ProductImage