pragma solidity ^0.5.0;

contract Marketplace {
    // Variables
    mapping(uint => Product) public products; // Guarda los productos con su ID.
    uint public productCount = 0; // Contador de productos que hay en el marketplace.

    struct Product {
        uint id;
        string name;
        uint price;
        address payable owner;
        bool purchased;
    }

    // Eventos
    event ProductCreated(
        uint id,
        string name,
        uint price,
        address payable owner,
        bool purchased
    );

    event ProductPurchased(
        uint id,
        string name,
        uint price,
        address payable owner,
        bool purchased
    );

    // Constructor
    constructor() public {

    }

    // Funciones
    /**
     * @notice Función que nos permite crear un producto.
     * @param _name Nombre del producto.
     * @param _price Precio del producto.
     */
    function createProduct(string memory _name, uint _price) public {
        require(bytes(_name).length > 0, 'Debes introducir un nombre valido.');
        require(_price > 0, 'El precio debe ser mayor a 0.');

        productCount++; // Incrementa el contador de productos.
        products[productCount] = Product(productCount, _name, _price, msg.sender, false); // Crea el producto y lo añade al mapping.

        emit ProductCreated(productCount, _name, _price, msg.sender, false); // Emite el evento.
    }

    /**
     * @notice Función que permite comprar un producto.
     * @param _id Identificador del producto.
     */
    function purchaseProduct(uint _id) public payable {
        Product memory _product = products[_id]; // Hago una copia del producto.
        address payable _seller = _product.owner;

        require(_product.id > 0 && _product.id <= productCount, 'El producto no existe.');
        require(msg.value >= _product.price, 'No has pagado lo suficiente por el producto.');
        require(!_product.purchased, 'El producto ya ha sido comprado.');
        require(_seller != msg.sender, 'Ya eres duenho del producto.');

        _product.owner = msg.sender; // Cambio el dueño del producto.
        _product.purchased = true; // Indica que el producto ya ha sido comprado.
        products[_id] = _product; // Actualiza el producto guardando la copia en el producto real.
        address(_seller).transfer(msg.value); // Envía la cantidad pagada por el producto al dueño (Primer dueño).

        emit ProductPurchased(productCount, _product.name, _product.price, msg.sender, true); // Emite el evento.
    }
}