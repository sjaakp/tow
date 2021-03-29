<?php

namespace sjaakp\tow\project;

use yii\web\AssetBundle;

class PrologAsset extends AssetBundle {

    public $js = [
        'tow.js'
    ];

    public $publishOptions = [
        'forceCopy' => YII_DEBUG
    ];

    /**
     * @inheritDoc
     */
    public function init()
    {
        parent::init();
        $this->sourcePath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'dist';
    }
}
