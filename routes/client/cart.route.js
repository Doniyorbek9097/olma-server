const cartModel = require("../../models/cart.model");
const router = require("express").Router();
const mongoose = require("mongoose")
const langReplace = require("../../utils/langReplace");
const { checkToken } = require('../../middlewares/authMiddleware');
const { isEqual } = require("../../utils/isEqual");
const { populate } = require("../../models/user.model");

router.post("/add-cart", async (req, res) => {
    try {
        const { product: { quantity, variant_id, product_id }, cart_id } = req.body;

        let cart = await cartModel.findOne({ "_id": cart_id })
        // Savatcha topilmasa, yangi savatcha yaratish
        if (!cart) {
            cart = new cartModel(req.body);
            cart.products.push(req.body.product)
            const data = await cart.save()
            return res.status(201).json({ message: "success created", data });
        }


        // Savatchada mahsulotni qidirish va yangilash yoki yangi mahsulot qo'shish
        let foundProduct = cart.products.find(item =>
            item.product_id.toString() === product_id && variant_id && item.variant_id.toString() === variant_id
        );

        if (foundProduct) {
            foundProduct.quantity = quantity;
        } else {
            cart.products.push(req.body.product);
        }



        let newCart = await cart.save();
        newCart = await cartModel.findById(newCart._id)
        .populate({
            path: 'products.product_id',
            populate: [
                {
                    path: "product",
                
                },
                {
                    path: "shop",
                    select: "name"
                },
                {
                    path: "brend",
                    select: "name"
                }
            ]
        })
        .populate({
            path: 'products.variant_id',
            populate: [
                {
                    path: "attributes.option"
                },
                {
                    path: "attributes.value"
                }
            ]
        })

    const products = newCart.products.flatMap(item => {
        let product = item?.variant_id || item.product_id;
        return {
            product: {
                ...product._doc,
                product_id: item.product_id._id,
                variant_id: item?.variant_id._id,
                product: item.product_id.product
            },

            quantity: item.quantity,
        }
    })

    const data = {
        ...newCart._doc,
        products
    }


        return res.json({ message: "success updated", data });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
});


router.get("/cart/:id", async (req, res) => {
    try {
        let cart = await cartModel.findOne({ _id: req.params.id })
            .populate({
                path: 'products.product_id',
                populate: [
                    {
                        path: "product",
                        select: "name"
                    },
                    {
                        path: "shop",
                        select: "name"
                    },
                    {
                        path: "brend",
                        select: "name"
                    }
                ]
            })
            .populate({
                path: 'products.variant_id',
                populate: [
                    {
                        path: "attributes.option"
                    },
                    {
                        path: "attributes.value"
                    }
                ]
            })

        const products = cart.products.flatMap(item => {
            let product = item?.variant_id || item.product_id;
            return {
                product: {
                    ...product._doc,
                    product_id: item.product_id._id,
                    variant_id: item?.variant_id._id,
                    product:item.product_id.product

                },

                quantity: item.quantity,
            }
        })

        const data = {
            ...cart._doc,
            products
        }

        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return res.status(500).json(error.message);
    }
});




router.delete("/cart-delete/:id/:product_id", async (req, res) => {
    try {
        if (mongoose.isValidObjectId(req.params.id)) {
            const cart = await cartModel.findById(req.params.id);
            const productIndex = cart.products.findIndex(item => item._id === req.params.product_id);
            cart.products.splice(productIndex, 1);
            const SavedCart = await cart.save();
            return res.status(200).json(SavedCart)
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json(error.message)
    }
});


router.post("/cart-clear/:id", async (req, res) => {
    try {
        const cleared = await cartModel.deleteMany();
        return res.status(200).json(cleared);
    } catch (error) {
        console.log(error);
        res.status(500).send("Serverda Xatolik")
    }
})

module.exports = router;