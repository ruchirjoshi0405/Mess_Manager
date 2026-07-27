import React from 'react'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { X } from 'lucide-react'
import { Card, CardContent } from './ui/card'

const ImageUpload = ({ productData, setProductData }) => {
    const handleFiles = (e) => {
        const files = Array.from(e.target.files || [])
        if(files.length) {
            setProductData((prev) => ({
                ...prev,
                productImg: [...prev.productImg, ...files]
            }))
        }
    }

    const removeImg = (idx) => {
        setProductData((prev) => {
            const updatedImages = prev.productImg.filter((_, i) => i !== idx);
            return {...prev, productImg: updatedImages}
        })
    }

    return (
        <div className='grid gap-2'>
            <Label>Product Images</Label>
            <Input type='file' id="file-upload" className='hidden' accept="image/*" multiple onChange={handleFiles} />
            
            {/* Added asChild to stop Shadcn from nesting a <label> inside a <button> element */}
            <Button variant="outline" asChild>
                <label htmlFor="file-upload" className='cursor-pointer w-full text-center'>
                    Upload Images
                </label>
            </Button>
            
            {/* Image preview */}
            {
                productData.productImg.length > 0 && (
                    <div className='grid grid-cols-2 gap-4 mt-3 sm:grid-cols-3'>
                        {
                            productData.productImg.map((file, idx) => {
                                let preview
                                if (file instanceof File) {
                                    preview = URL.createObjectURL(file)
                                }
                                else if (file?.url) {
                                    preview = file.url
                                } else {
                                    return null
                                }

                                return (
                                    <Card key={idx} className='relative group overflow-hidden border border-gray-200 rounded-md'>
                                        {/* Added className="p-0" to remove default shadcn paddings causing image spacing bugs */}
                                        <CardContent className="p-0">
                                            <img 
                                                src={preview} 
                                                alt={`preview-${idx}`} 
                                                className='w-full h-32 object-cover transition-transform duration-200 group-hover:scale-105' 
                                            />

                                            {/* remove button */}
                                            <button onClick={() => removeImg(idx)} className='absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition duration-200'>
                                                <X size={14} />
                                            </button>
                                        </CardContent>
                                    </Card>
                                )
                            })
                        }
                    </div>
                )
            }
        </div>
    )
}

export default ImageUpload