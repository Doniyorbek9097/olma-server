const { Schema, model } = require("mongoose");

const reviewSchema = Schema(
    {
        name: { type: String, required: true },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
)



const propertiesSchema = Schema({
    key: {
        type: String,
        intl: true
    },
    value: {
        type: String,
        intl: true
    }
},

    {
        toJSON: { virtuals: true }
    }

);


const attributesSchema = Schema({
    title: {
        type: String,
        intl: true
    },
    children: [{
        value: {
            type: String,
            intl: true
        },
        sku: String,
        images: []
    }]
})


const attributeModel = model("Attribute", attributesSchema)


const productSchema = Schema({
    name: {
        type: String,
        intl: true
    },

    slug: {
        type: String,
        required: true
    },

    discription: {
        type: String,
        intl: true
    },

    images: [],
    inStock: {
        type: Number,
        default: 1
    },
    orginal_price: { type: Number, min: 0 },
    sale_price: { type: Number, min: 0 },

    properteis: [propertiesSchema],

    active: {
        type: Boolean,
        default: false
    },

    categories: [{
        type: Schema.Types.ObjectId,
        ref:"Category"
    }],

    parentCategory: {
        type: Schema.Types.ObjectId,
        ref: "Category"
    },

    subCategory: {
        type: Schema.Types.ObjectId,
        ref: "Category"
    },

    childCategory: {
        type: Schema.Types.ObjectId,
        ref: "Category"
    },

    country: {
        type: String,
        default: ""
    },

    brend: {
        type: Schema.Types.ObjectId,
        ref: "Brend",
    },

    shop: {
        type: Schema.Types.ObjectId,
        ref: "Shop"
    },

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"

    },

    reviews: {
        type: [reviewSchema]
    },

    views: {
        type: [Schema.Types.ObjectId],
        ref: "User"
    },

    viewsCount: {
        type: Number,
        default: 0
    },

    soldOut: [{
        type: Schema.Types.ObjectId,
        ref: "Order"
    }],

    soldOutCount: {
        type: Number,
        default: 0
    },

    returned: [{
        type: Schema.Types.ObjectId,
        ref: "Order"
    }],

    returnedCount: {
        type: Number,
        default: 0
    },

    rating: {
        type: Number,
        required: true,
        default: 0,
    },

    discount: {
        type: Number
    },

    attributes: [attributesSchema],
    
    variants: [{
        name: String,
        orginal_price: Number,
        sale_price: Number,
        inStock: {
            type: Number,
            default: 1
        },
        discount: Number,
        sku: String,

        soldOut: [{
            type: Schema.Types.ObjectId,
            ref: "Order"
        }],

        soldOutCount: {
            type: Number,
            default: 0
        },

        returned: [{
            type: Schema.Types.ObjectId,
            ref: "Order"
        }],

        returnedCount: {
            type: Number,
            default: 0
        },

    }],

    returnedCount: {
        type: Number,
        default: 0
    },

    type: {
        type: String,
        enum: ["product"],
        default: "product"
    }
},

    {
        timestamps: true,
        toJSON: { virtuals: true }
    }

);


productSchema.pre("save", async function (next) {
    this.discount = parseInt(((this.orginal_price - this.sale_price) / this.orginal_price) * 100);
    next();
})


productSchema.virtual("shop_variants", {
    ref: "ShopProducts",
    localField: "_id",
    foreignField: "product",
})


const productModel = model("Product", productSchema);
module.exports = {
    attributeModel,
    productModel,
}

